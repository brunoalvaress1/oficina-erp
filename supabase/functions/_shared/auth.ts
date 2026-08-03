import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export function criarClienteAdmin(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
}

export interface FuncionarioAutenticado {
  id: string
  oficinaId: string
  nome: string
}

// Verifica o JWT do funcionário que chamou a function e confere se ele tem a
// permissão exigida — mesma checagem que o hasPermission() do client faz,
// só que aqui é a barreira de verdade (o client não tem como forjar isso).
export async function autenticarFuncionario(
  req: Request,
  admin: SupabaseClient,
  codigoPermissao: string,
): Promise<FuncionarioAutenticado> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) throw new Error('NAO_AUTENTICADO')

  const token = authHeader.replace('Bearer ', '')
  const { data: userData, error: userError } = await admin.auth.getUser(token)
  if (userError || !userData.user) throw new Error('NAO_AUTENTICADO')

  const { data: funcionario, error: funcionarioError } = await admin
    .from('funcionarios')
    .select('id, oficina_id, nome, ativo')
    .eq('user_id', userData.user.id)
    .single()
  if (funcionarioError || !funcionario || !funcionario.ativo) throw new Error('FUNCIONARIO_NAO_ENCONTRADO')

  const { data: permissao } = await admin
    .from('funcionario_permissoes')
    .select('permissoes!inner(codigo)')
    .eq('funcionario_id', funcionario.id)
    .eq('permissoes.codigo', codigoPermissao)
    .maybeSingle()

  if (!permissao) throw new Error('SEM_PERMISSAO')

  return { id: funcionario.id, oficinaId: funcionario.oficina_id, nome: funcionario.nome }
}
