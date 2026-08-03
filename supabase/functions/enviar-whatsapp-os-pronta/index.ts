// Envia a mensagem automática de "OS pronta" pro cliente via Evolution API,
// disparada pelo client logo após a OS ser finalizada e enviada ao Caixa.
//
// Diferente da API oficial da Meta, a Evolution API conecta via WhatsApp Web
// (número escaneado por QR code) e manda texto livre — sem exigir template
// pré-aprovado. Reaproveita a mesma mensagem padrão configurada em
// Configurações → Dados da Oficina (oficinas.mensagem_whatsapp_padrao).
import { corsHeaders } from '../_shared/cors.ts'
import { autenticarFuncionario, criarClienteAdmin } from '../_shared/auth.ts'
import { enviarTextoWhatsapp, normalizarTelefoneWhatsapp } from '../_shared/whatsapp.ts'

function montarMensagem(nomeCliente: string, numeroOrdem: number, valorTotal: number, template: string | null, nomeEmpresa: string | null): string {
  const valorFormatado = Number(valorTotal ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  if (template && template.trim()) {
    return template
      .replaceAll('{cliente}', nomeCliente)
      .replaceAll('{os}', String(numeroOrdem))
      .replaceAll('{valor}', valorFormatado)
      .replaceAll('{empresa}', nomeEmpresa || 'Oficina')
  }
  return [
    `Olá ${nomeCliente}!`,
    '',
    `Sua Ordem de Serviço nº ${numeroOrdem} está pronta.`,
    '',
    `Valor: ${valorFormatado}`,
    '',
    'Aguardamos você.',
    `Equipe ${nomeEmpresa || 'Oficina'}.`,
  ].join('\n')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const admin = criarClienteAdmin()

  try {
    const funcionario = await autenticarFuncionario(req, admin, 'ordens.finalizar')
    const { ordemServicoId } = await req.json()
    if (!ordemServicoId) throw new Error('ORDEM_SERVICO_ID_OBRIGATORIO')

    const { data: ordem, error: erroOrdem } = await admin
      .from('ordens_servico')
      .select('id, numero, valor_total, oficina_id, cliente_id')
      .eq('id', ordemServicoId)
      .single()
    if (erroOrdem || !ordem) throw new Error('ORDEM_NAO_ENCONTRADA')

    const { data: integracao } = await admin
      .from('integracoes')
      .select('config, status')
      .eq('oficina_id', ordem.oficina_id)
      .eq('codigo', 'whatsapp')
      .maybeSingle()
    if (!integracao?.status) throw new Error('WHATSAPP_NAO_CONFIGURADO')

    const instanceName: string | undefined = (integracao.config as any)?.instanceName
    if (!instanceName) throw new Error('WHATSAPP_SEM_INSTANCIA: configure o nome da instância em Configurações → WhatsApp.')

    const { data: cliente, error: erroCliente } = await admin
      .from('clientes')
      .select('nome, telefone')
      .eq('id', ordem.cliente_id)
      .single()
    if (erroCliente || !cliente) throw new Error('CLIENTE_NAO_ENCONTRADO')
    if (!cliente.telefone) throw new Error('CLIENTE_SEM_TELEFONE')

    const { data: oficina } = await admin
      .from('oficinas')
      .select('nome_fantasia, razao_social, mensagem_whatsapp_padrao')
      .eq('id', ordem.oficina_id)
      .single()
    const nomeOficina = oficina?.nome_fantasia || oficina?.razao_social || 'Oficina'

    const telefone = normalizarTelefoneWhatsapp(cliente.telefone)
    const texto = montarMensagem(cliente.nome, ordem.numero, ordem.valor_total, oficina?.mensagem_whatsapp_padrao ?? null, nomeOficina)

    const { status, data: respostaEvolution } = await enviarTextoWhatsapp(instanceName, telefone, texto)
    const sucesso = status >= 200 && status < 300 && !respostaEvolution?.error
    const mensagemErro = sucesso ? null : respostaEvolution?.message || respostaEvolution?.error || JSON.stringify(respostaEvolution)

    await admin.from('mensagens_whatsapp').insert({
      oficina_id: ordem.oficina_id,
      ordem_servico_id: ordem.id,
      cliente_id: ordem.cliente_id,
      telefone,
      template_nome: 'texto_livre',
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
