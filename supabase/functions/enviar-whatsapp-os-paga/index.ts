// Envia pro cliente, via WhatsApp (Evolution API), o link público da OS
// (rota /os/:id, sem login) assim que o pagamento é recebido no Caixa.
import { corsHeaders } from '../_shared/cors.ts'
import { autenticarFuncionario, criarClienteAdmin } from '../_shared/auth.ts'
import { enviarTextoWhatsapp, normalizarTelefoneWhatsapp } from '../_shared/whatsapp.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const admin = criarClienteAdmin()

  try {
    const funcionario = await autenticarFuncionario(req, admin, 'caixa.receber')
    const { caixaLancamentoId } = await req.json()
    if (!caixaLancamentoId) throw new Error('CAIXA_LANCAMENTO_ID_OBRIGATORIO')

    const { data: lancamento, error: erroLancamento } = await admin
      .from('caixa_lancamentos')
      .select('id, oficina_id, ordem_servico_id')
      .eq('id', caixaLancamentoId)
      .single()
    if (erroLancamento || !lancamento) throw new Error('LANCAMENTO_NAO_ENCONTRADO')

    const { data: ordem, error: erroOrdem } = await admin
      .from('ordens_servico')
      .select('id, numero, valor_total, cliente_id')
      .eq('id', lancamento.ordem_servico_id)
      .single()
    if (erroOrdem || !ordem) throw new Error('ORDEM_NAO_ENCONTRADA')

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

    const valorFormatado = Number(ordem.valor_total ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    const telefone = normalizarTelefoneWhatsapp(cliente.telefone)
    const link = `${siteUrl.replace(/\/$/, '')}/os/${ordem.id}`
    const texto = [
      `Olá ${cliente.nome}!`,
      '',
      `Recebemos o pagamento da sua Ordem de Serviço nº ${ordem.numero} (${valorFormatado}).`,
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
      template_nome: 'texto_livre_os_paga',
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
