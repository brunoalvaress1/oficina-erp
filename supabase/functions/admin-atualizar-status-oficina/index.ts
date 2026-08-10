// Bloqueia ou reativa uma oficina (ex: inadimplência da mensalidade). Uma
// oficina bloqueada perde acesso a TODAS as tabelas do sistema — o bloqueio é
// aplicado num único ponto central (a função minha_oficina_id() no banco),
// não em cada policy, então isso funciona automaticamente sem tocar em nada
// além dessa function.
import { corsHeaders } from '../_shared/cors.ts'
import { autenticarSuperAdmin, criarClienteAdmin } from '../_shared/auth.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const admin = criarClienteAdmin()

  try {
    await autenticarSuperAdmin(req, admin)
    const { oficinaId, statusAssinatura, motivo, vencimentoMensalidade, valorMensalidade } = await req.json()
    if (!oficinaId) throw new Error('OFICINA_ID_OBRIGATORIO')
    if (statusAssinatura !== undefined && statusAssinatura !== 'ativa' && statusAssinatura !== 'bloqueada') {
      throw new Error('STATUS_INVALIDO')
    }
    if (statusAssinatura === undefined && vencimentoMensalidade === undefined && valorMensalidade === undefined) {
      throw new Error('NADA_PARA_ATUALIZAR')
    }

    const colunas: Record<string, unknown> = {}
    if (statusAssinatura !== undefined) {
      colunas.status_assinatura = statusAssinatura
      colunas.bloqueada_em = statusAssinatura === 'bloqueada' ? new Date().toISOString() : null
      colunas.bloqueada_motivo = statusAssinatura === 'bloqueada' ? motivo || null : null
    }
    if (vencimentoMensalidade !== undefined) colunas.vencimento_mensalidade = vencimentoMensalidade || null
    if (valorMensalidade !== undefined) colunas.valor_mensalidade = valorMensalidade === null || valorMensalidade === '' ? null : Number(valorMensalidade)

    const { data: oficina, error } = await admin.from('oficinas').update(colunas).eq('id', oficinaId).select('*').single()
    if (error) throw new Error(error.message)

    return new Response(JSON.stringify({ oficina }), {
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
