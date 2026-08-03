// Cria uma nova oficina do zero: a oficina em si, o primeiro login (usuário
// admin dela), concede todas as permissões pra esse primeiro funcionário, e
// semeia as configurações padrão (formas de pagamento, notificações,
// integrações desativadas, numeração/impressão/parcelamento). Só acessível a
// super admins — nunca exposto pro client normal.
import { corsHeaders } from '../_shared/cors.ts'
import { autenticarSuperAdmin, criarClienteAdmin } from '../_shared/auth.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const admin = criarClienteAdmin()

  try {
    await autenticarSuperAdmin(req, admin)
    const { nomeFantasia, razaoSocial, cnpj, emailAdmin, senhaAdmin, nomeAdmin } = await req.json()
    if (!nomeFantasia) throw new Error('NOME_FANTASIA_OBRIGATORIO')
    if (!emailAdmin || !senhaAdmin || !nomeAdmin) throw new Error('DADOS_DO_ADMIN_OBRIGATORIOS')
    if (String(senhaAdmin).length < 6) throw new Error('SENHA_MUITO_CURTA: mínimo 6 caracteres.')

    // 1. Oficina
    const { data: oficina, error: erroOficina } = await admin
      .from('oficinas')
      .insert({ nome: nomeFantasia, nome_fantasia: nomeFantasia, razao_social: razaoSocial || null, cnpj: cnpj || null, email: emailAdmin })
      .select('*')
      .single()
    if (erroOficina || !oficina) throw new Error(erroOficina?.message ?? 'Erro ao criar oficina')

    // 2. Login do primeiro usuário (admin da nova oficina)
    const { data: authUser, error: erroAuth } = await admin.auth.admin.createUser({
      email: emailAdmin,
      password: senhaAdmin,
      email_confirm: true,
    })
    if (erroAuth || !authUser.user) {
      // Rollback manual — sem oficina órfã se o login falhar (ex: e-mail já existe).
      await admin.from('oficinas').delete().eq('id', oficina.id)
      throw new Error(erroAuth?.message ?? 'Erro ao criar login do administrador')
    }

    // 3. Funcionário admin dessa oficina
    const { data: funcionario, error: erroFuncionario } = await admin
      .from('funcionarios')
      .insert({ user_id: authUser.user.id, oficina_id: oficina.id, nome: nomeAdmin, cargo: 'Administrador', email: emailAdmin, ativo: true })
      .select('*')
      .single()
    if (erroFuncionario || !funcionario) {
      await admin.auth.admin.deleteUser(authUser.user.id)
      await admin.from('oficinas').delete().eq('id', oficina.id)
      throw new Error(erroFuncionario?.message ?? 'Erro ao criar funcionário administrador')
    }

    // 4. Todas as permissões pro admin + configurações padrão da oficina
    const { error: erroPermissoes } = await admin.rpc('conceder_todas_permissoes', { p_funcionario_id: funcionario.id })
    if (erroPermissoes) throw new Error(erroPermissoes.message)

    const { error: erroProvisionamento } = await admin.rpc('provisionar_oficina_padrao', { p_oficina_id: oficina.id })
    if (erroProvisionamento) throw new Error(erroProvisionamento.message)

    return new Response(JSON.stringify({ oficina, funcionario }), {
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
