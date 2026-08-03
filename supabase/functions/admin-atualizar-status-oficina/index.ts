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
    const { oficinaId, statusAssinatura, motivo } = await req.json()
    if (!oficinaId) throw new Error('OFICINA_ID_OBRIGATORIO')
    if (statusAssinatura !== 'ativa' && statusAssinatura !== 'bloqueada') throw new Error('STATUS_INVALIDO')

    const { data: oficina, error } = await admin
      .from('oficinas')
      .update({
        status_assinatura: statusAssinatura,
        bloqueada_em: statusAssinatura === 'bloqueada' ? new Date().toISOString() : null,
        bloqueada_motivo: statusAssinatura === 'bloqueada' ? motivo || null : null,
      })
      .eq('id', oficinaId)
      .select('*')
      .single()
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
