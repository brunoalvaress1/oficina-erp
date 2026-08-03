// Cancela uma nota já autorizada. Pela documentação oficial da Focus, a NFC-e
// só pode ser cancelada em até 30 MINUTOS após a emissão (prazo bem mais curto
// que o de NF-e comum) — se passar disso, a Focus retorna erro, repassado como
// está pro client. NFS-e Nacional também tem prazo (não documentado
// publicamente) — a Focus sinaliza isso com erro V999 "fora do prazo de
// cancelamento permitido".
import { corsHeaders } from '../_shared/cors.ts'
import { autenticarFuncionario, criarClienteAdmin } from '../_shared/auth.ts'
import { focusNfeDelete, type AmbienteNfe } from '../_shared/focusnfe.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const admin = criarClienteAdmin()

  try {
    const funcionario = await autenticarFuncionario(req, admin, 'notas_fiscais.cancelar')
    const { notaFiscalId, justificativa } = await req.json()
    if (!notaFiscalId) throw new Error('NOTA_FISCAL_ID_OBRIGATORIO')
    if (!justificativa || justificativa.trim().length < 15 || justificativa.trim().length > 255) {
      throw new Error('JUSTIFICATIVA_OBRIGATORIA: a Sefaz exige uma justificativa entre 15 e 255 caracteres.')
    }

    const { data: nota, error: erroNota } = await admin
      .from('notas_fiscais_saida')
      .select('id, referencia, ambiente, tipo, status')
      .eq('id', notaFiscalId)
      .single()
    if (erroNota || !nota) throw new Error('NOTA_NAO_ENCONTRADA')
    if (nota.status !== 'autorizada') throw new Error('SO_E_POSSIVEL_CANCELAR_NOTA_AUTORIZADA')

    const caminho = nota.tipo === 'nfe' ? `/v2/nfe/${nota.referencia}` : nota.tipo === 'nfse' ? `/v2/nfsen/${nota.referencia}` : `/v2/nfce/${nota.referencia}`
    const { status, data: respostaFocus } = await focusNfeDelete(nota.ambiente as AmbienteNfe, caminho, {
      justificativa: justificativa.trim(),
    })

    // NFS-e Nacional é uma exceção: erro de cancelamento vem com HTTP 200 e
    // "status": "erro_cancelamento" (em vez de um código HTTP de erro) — tem
    // que checar o corpo também, não só o status HTTP.
    if (status !== 200 && status !== 202) {
      throw new Error(`ERRO_AO_CANCELAR: ${respostaFocus.mensagem ?? JSON.stringify(respostaFocus)}`)
    }
    if (respostaFocus?.status === 'erro_cancelamento') {
      const mensagem = Array.isArray(respostaFocus.erros) && respostaFocus.erros.length > 0
        ? respostaFocus.erros.map((e: any) => e.mensagem).join('; ')
        : 'Erro ao cancelar a NFS-e.'
      throw new Error(`ERRO_AO_CANCELAR: ${mensagem}`)
    }

    const { data: notaAtualizada, error: erroUpdate } = await admin
      .from('notas_fiscais_saida')
      .update({ status: 'cancelada', resposta_provedor: respostaFocus, updated_at: new Date().toISOString() })
      .eq('id', notaFiscalId)
      .select('*')
      .single()
    if (erroUpdate) throw new Error(erroUpdate.message)

    await admin.from('notas_fiscais_saida_historico').insert({
      nota_fiscal_id: notaFiscalId,
      status_anterior: nota.status,
      status_novo: 'cancelada',
      mensagem: `Cancelada por ${funcionario.nome}: ${justificativa.trim()}`,
    })

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
