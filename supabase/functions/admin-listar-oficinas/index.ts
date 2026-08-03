// Lista todas as oficinas cadastradas na plataforma, com contagem de
// funcionários e status da assinatura — só acessível a super admins.
import { corsHeaders } from '../_shared/cors.ts'
import { autenticarSuperAdmin, criarClienteAdmin } from '../_shared/auth.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const admin = criarClienteAdmin()

  try {
    await autenticarSuperAdmin(req, admin)

    const { data: oficinas, error } = await admin
      .from('oficinas')
      .select('id, nome_fantasia, razao_social, cnpj, email, status_assinatura, bloqueada_em, bloqueada_motivo, created_at, funcionarios(id)')
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)

    const resultado = (oficinas ?? []).map((o: any) => ({
      id: o.id,
      nomeFantasia: o.nome_fantasia,
      razaoSocial: o.razao_social,
      cnpj: o.cnpj,
      email: o.email,
      statusAssinatura: o.status_assinatura,
      bloqueadaEm: o.bloqueada_em,
      bloqueadaMotivo: o.bloqueada_motivo,
      createdAt: o.created_at,
      qtdFuncionarios: Array.isArray(o.funcionarios) ? o.funcionarios.length : 0,
    }))

    return new Response(JSON.stringify({ oficinas: resultado }), {
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
