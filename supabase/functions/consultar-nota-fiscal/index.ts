// Reconsulta o status de uma nota na Focus (emissão é assíncrona — a Focus não
// autoriza na hora, então essa function existe pra ser chamada pelo botão
// "Verificar status" da tela de Notas Fiscais).
import { corsHeaders } from '../_shared/cors.ts'
import { autenticarFuncionario, criarClienteAdmin } from '../_shared/auth.ts'
import { focusNfeGet, resolverCaminhoFocus, type AmbienteNfe } from '../_shared/focusnfe.ts'

// Mapeamento do status que a Focus devolve pro nosso enum interno. NFS-e
// Nacional usa "negado" em vez de "denegado" (NFC-e/NF-e) — ambos mapeados.
const STATUS_FOCUS_PARA_INTERNO: Record<string, string> = {
  processando_autorizacao: 'processando',
  autorizado: 'autorizada',
  erro_autorizacao: 'rejeitada',
  cancelado: 'cancelada',
  denegado: 'rejeitada',
  negado: 'rejeitada',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const admin = criarClienteAdmin()

  try {
    await autenticarFuncionario(req, admin, 'notas_fiscais.visualizar')
    const { notaFiscalId } = await req.json()
    if (!notaFiscalId) throw new Error('NOTA_FISCAL_ID_OBRIGATORIO')

    const { data: nota, error: erroNota } = await admin
      .from('notas_fiscais_saida')
      .select('id, referencia, ambiente, tipo, status')
      .eq('id', notaFiscalId)
      .single()
    if (erroNota || !nota) throw new Error('NOTA_NAO_ENCONTRADA')
    if (!nota.referencia) throw new Error('NOTA_SEM_REFERENCIA')

    const caminho = nota.tipo === 'nfe' ? `/v2/nfe/${nota.referencia}` : nota.tipo === 'nfse' ? `/v2/nfsen/${nota.referencia}` : `/v2/nfce/${nota.referencia}`
    const { data: respostaFocus } = await focusNfeGet(nota.ambiente as AmbienteNfe, caminho)

    const statusNovo = STATUS_FOCUS_PARA_INTERNO[respostaFocus.status as string] ?? nota.status
    const mensagemErro =
      respostaFocus.mensagem_sefaz ??
      (Array.isArray(respostaFocus.erros) && respostaFocus.erros.length > 0 ? respostaFocus.erros.map((e: any) => e.mensagem).join('; ') : null)

    // NFS-e Nacional usa nomes de campo diferentes de NFC-e/NF-e pro
    // DANFE/DANFSe e não tem chave de acesso/protocolo separados na consulta.
    const { data: notaAtualizada, error: erroUpdate } = await admin
      .from('notas_fiscais_saida')
      .update({
        status: statusNovo,
        numero: respostaFocus.numero ?? null,
        serie: respostaFocus.serie ?? null,
        chave_acesso: respostaFocus.chave_nfe ?? null,
        // Campo correto pela documentação oficial é "numero_protocolo" — "protocolo"
        // só aparece quando a consulta usa completa=1, mantido como fallback.
        protocolo_autorizacao: respostaFocus.numero_protocolo ?? respostaFocus.protocolo ?? null,
        url_danfe: respostaFocus.url_danfse ?? resolverCaminhoFocus(nota.ambiente as AmbienteNfe, respostaFocus.caminho_danfe),
        url_xml: resolverCaminhoFocus(nota.ambiente as AmbienteNfe, respostaFocus.caminho_xml_nota_fiscal),
        qrcode_url: respostaFocus.qrcode_url ?? respostaFocus.url ?? null,
        mensagem_erro: mensagemErro,
        resposta_provedor: respostaFocus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', notaFiscalId)
      .select('*')
      .single()
    if (erroUpdate) throw new Error(erroUpdate.message)

    if (statusNovo !== nota.status) {
      await admin.from('notas_fiscais_saida_historico').insert({
        nota_fiscal_id: notaFiscalId,
        status_anterior: nota.status,
        status_novo: statusNovo,
        mensagem: mensagemErro,
      })
    }

    return new Response(JSON.stringify({ nota: notaAtualizada }), {
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
