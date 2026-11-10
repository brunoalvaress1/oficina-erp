// Envia pro cliente, via WhatsApp (Evolution API), o link público da OS
// (rota /os/:id, sem login) assim que o pagamento é recebido no Caixa.
import { corsHeaders } from '../_shared/cors.ts'
import { autenticarFuncionario, criarClienteAdmin } from '../_shared/auth.ts'
import { enviarTextoWhatsapp, normalizarTelefoneWhatsapp } from '../_shared/whatsapp.ts'
import { verificarFuncionalidadeAtiva } from '../_shared/funcionalidades.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const admin = criarClienteAdmin()

  try {
    const funcionario = await autenticarFuncionario(req, admin, 'caixa.receber')
    await verificarFuncionalidadeAtiva(admin, funcionario.oficinaId, 'whatsapp_automatico')
    const { caixaLancamentoId } = await req.json()
    if (!caixaLancamentoId) throw new Error('CAIXA_LANCAMENTO_ID_OBRIGATORIO')

    const { data: lancamento, error: erroLancamento } = await admin
      .from('caixa_lancamentos')
      .select('id, oficina_id, ordem_servico_id, status, data_vencimento_pendente')
      .eq('id', caixaLancamentoId)
      .single()
    if (erroLancamento || !lancamento) throw new Error('LANCAMENTO_NAO_ENCONTRADO')

    const { data: ordem, error: erroOrdem } = await admin
      .from('ordens_servico')
      .select('id, numero, valor_total, cliente_id')
      .eq('id', lancamento.ordem_servico_id)
      .single()
    if (erroOrdem || !ordem) throw new Error('ORDEM_NAO_ENCONTRADA')

    // Pode ter sido um recebimento PARCIAL (sobra fica como "pendente" no
    // mesmo lançamento, ver migration 20260831140000) — nesse caso a mensagem
    // não pode dizer que o pagamento foi concluído. Soma todas as rodadas de
    // recebimento não canceladas (dinheiro de verdade + desconto já dado) pra
    // saber quanto ainda falta, e usa a rodada mais recente (a que acabou de
    // disparar esse envio) pra dizer quanto entrou agora.
    const { data: recebimentos, error: erroRecebimentos } = await admin
      .from('caixa_recebimentos')
      .select('valor_total, desconto, created_at')
      .eq('caixa_lancamento_id', caixaLancamentoId)
      .eq('cancelado', false)
      .order('created_at', { ascending: true })
    if (erroRecebimentos) throw new Error(erroRecebimentos.message)

    const rodadas = recebimentos ?? []
    const valorRecebidoAcumulado = rodadas.reduce((soma, r) => soma + Number(r.valor_total ?? 0) + Number(r.desconto ?? 0), 0)
    const ultimaRodada = rodadas[rodadas.length - 1]
    const valorRecebidoAgora = ultimaRodada ? Number(ultimaRodada.valor_total ?? 0) + Number(ultimaRodada.desconto ?? 0) : 0
    const valorFaltando = Math.max(0, Math.round((Number(ordem.valor_total ?? 0) - valorRecebidoAcumulado) * 100) / 100)
    const pagamentoParcial = lancamento.status === 'pendente' && valorFaltando > 0

    const { data: integracao } = await admin
      .from('integracoes')
      .select('config, status')
      .eq('oficina_id', lancamento.oficina_id)
      .eq('codigo', 'whatsapp')
      .maybeSingle()
    if (!integracao?.status) throw new Error('WHATSAPP_NAO_CONFIGURADO')

    const config = (integracao.config as any) ?? {}
    const instanceName: string | undefined = config.instanceName
    const siteUrl: string | undefined = config.siteUrl
    if (!instanceName) throw new Error('WHATSAPP_SEM_INSTANCIA: configure o nome da instância em Configurações → WhatsApp.')
    if (!siteUrl) throw new Error('WHATSAPP_SEM_SITE_URL: configure o endereço do site em Configurações → WhatsApp.')

    const { data: cliente, error: erroCliente } = await admin
      .from('clientes')
      .select('nome, telefone')
      .eq('id', ordem.cliente_id)
      .single()
    if (erroCliente || !cliente) throw new Error('CLIENTE_NAO_ENCONTRADO')
    if (!cliente.telefone) throw new Error('CLIENTE_SEM_TELEFONE')

    const { data: oficina } = await admin.from('oficinas').select('nome_fantasia, razao_social').eq('id', lancamento.oficina_id).single()
    const nomeOficina = oficina?.nome_fantasia || oficina?.razao_social || 'Oficina'

    const formatarMoeda = (valor: number) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    const formatarDataBr = (data: string) => {
      const [ano, mes, dia] = data.split('-')
      return `${dia}/${mes}/${ano}`
    }
    const telefone = normalizarTelefoneWhatsapp(cliente.telefone)
    const link = `${siteUrl.replace(/\/$/, '')}/os/${ordem.id}`
    const dataVencimento = lancamento.data_vencimento_pendente as string | null
    const texto = pagamentoParcial
      ? [
          `Olá ${cliente.nome}!`,
          '',
          `Recebemos ${formatarMoeda(valorRecebidoAgora)} da sua Ordem de Serviço nº ${ordem.numero} (valor total ${formatarMoeda(Number(ordem.valor_total ?? 0))}).`,
          '',
          `Ainda falta ${formatarMoeda(valorFaltando)}, que fica em aberto para pagamento posterior${dataVencimento ? ` até ${formatarDataBr(dataVencimento)}` : ''}.`,
          '',
          `Acesse os detalhes aqui: ${link}`,
          '',
          `Obrigado pela preferência! Equipe ${nomeOficina}.`,
        ].join('\n')
      : [
          `Olá ${cliente.nome}!`,
          '',
          `Recebemos o pagamento da sua Ordem de Serviço nº ${ordem.numero} (${formatarMoeda(Number(ordem.valor_total ?? 0))}).`,
          '',
          `Acesse os detalhes aqui: ${link}`,
          '',
          `Obrigado pela preferência! Equipe ${nomeOficina}.`,
        ].join('\n')

    const { status, data: respostaEvolution } = await enviarTextoWhatsapp(instanceName, telefone, texto)
    const sucesso = status >= 200 && status < 300 && !respostaEvolution?.error
    const mensagemErro = sucesso ? null : respostaEvolution?.message || respostaEvolution?.error || JSON.stringify(respostaEvolution)

    await admin.from('mensagens_whatsapp').insert({
      oficina_id: lancamento.oficina_id,
      ordem_servico_id: ordem.id,
      cliente_id: ordem.cliente_id,
      telefone,
      template_nome: pagamentoParcial ? 'texto_livre_os_paga_parcial' : 'texto_livre_os_paga',
      status: sucesso ? 'enviada' : 'erro',
      mensagem_erro: mensagemErro,
      payload_enviado: { instanceName, telefone, texto },
      resposta_provedor: respostaEvolution,
      criado_por: funcionario.id,
    })

    if (!sucesso) throw new Error(mensagemErro || 'Erro ao enviar mensagem pelo WhatsApp.')

    return new Response(JSON.stringify({ sucesso: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : String(error)
    return new Response(JSON.stringify({ error: mensagem }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
