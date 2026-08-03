import { supabase } from '@/lib/supabase'
import { supabaseAuxiliar } from '@/lib/supabaseAuxiliar'
import { capturarIpPublico } from '@/utils/capturarIp'
import type {
  Funcionario,
  FuncionarioAtualizacaoInput,
  FuncionarioInput,
  ListarFuncionariosParams,
  ListarFuncionariosResult,
} from '../types/funcionario'
import type { HistoricoFuncionarioEntry, PermissaoCatalogo } from '../types/permissaoCatalogo'

function mapRow(row: any): Funcionario {
  return {
    id: row.id,
    userId: row.user_id,
    oficinaId: row.oficina_id,
    nome: row.nome,
    cargo: row.cargo,
    email: row.email,
    ativo: row.ativo,
    createdAt: row.created_at,
    especialidade: row.especialidade,
    comissaoPercentual: row.comissao_percentual != null ? Number(row.comissao_percentual) : null,
    metaMensal: row.meta_mensal != null ? Number(row.meta_mensal) : null,
    fotoUrl: row.foto_url,
  }
}

function traduzirErroSignUp(mensagem: string): string {
  if (mensagem.includes('already registered') || mensagem.includes('already been registered')) {
    return 'Já existe uma conta cadastrada com esse e-mail.'
  }
  if (mensagem.includes('Password') && mensagem.includes('character')) {
    return 'A senha precisa ter pelo menos 6 caracteres.'
  }
  if (mensagem.includes('invalid') && mensagem.includes('email')) {
    return 'E-mail inválido.'
  }
  return mensagem
}

function traduzirErro(mensagem: string): string {
  if (mensagem.includes('FUNCIONARIO_NAO_ENCONTRADO')) return 'Funcionário não encontrado.'
  return mensagem
}

export async function listarFuncionarios(
  oficinaId: string,
  params: ListarFuncionariosParams = {},
): Promise<ListarFuncionariosResult> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 20
  const search = params.search?.trim() ?? ''

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase.from('funcionarios').select('*', { count: 'exact' }).eq('oficina_id', oficinaId)

  if (search) {
    const termo = search.replace(/,/g, ' ')
    query = query.or(`nome.ilike.%${termo}%,cargo.ilike.%${termo}%,email.ilike.%${termo}%`)
  }

  const { data, count, error } = await query.order('nome').range(from, to)
  if (error) throw new Error(error.message)

  const funcionarios = (data ?? []).map(mapRow)
  const ids = funcionarios.map((f) => f.id)

  if (ids.length > 0) {
    const { data: permissoesRows, error: erroPermissoes } = await supabase
      .from('funcionario_permissoes')
      .select('funcionario_id')
      .in('funcionario_id', ids)
    if (erroPermissoes) throw new Error(erroPermissoes.message)

    const contagem = new Map<string, number>()
    for (const linha of permissoesRows ?? []) {
      contagem.set(linha.funcionario_id, (contagem.get(linha.funcionario_id) ?? 0) + 1)
    }
    for (const funcionario of funcionarios) {
      funcionario.quantidadePermissoes = contagem.get(funcionario.id) ?? 0
    }
  }

  return {
    data: funcionarios,
    total: count ?? 0,
    page,
    pageSize,
  }
}

export async function criarFuncionario(input: FuncionarioInput, oficinaId: string): Promise<Funcionario> {
  const { data: signUpData, error: signUpError } = await supabaseAuxiliar.auth.signUp({
    email: input.email,
    password: input.senha,
  })
  if (signUpError) throw new Error(traduzirErroSignUp(signUpError.message))
  if (!signUpData.user) throw new Error('Não foi possível criar o login do funcionário.')

  const { data, error } = await supabase
    .from('funcionarios')
    .insert({
      user_id: signUpData.user.id,
      oficina_id: oficinaId,
      nome: input.nome,
      cargo: input.cargo || null,
      email: input.email,
      ativo: true,
    })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return mapRow(data)
}

export async function atualizarFuncionario(id: string, alteracoes: FuncionarioAtualizacaoInput): Promise<Funcionario> {
  const { data, error } = await supabase
    .from('funcionarios')
    .update({
      ...(alteracoes.nome !== undefined && { nome: alteracoes.nome }),
      ...(alteracoes.cargo !== undefined && { cargo: alteracoes.cargo || null }),
      ...(alteracoes.ativo !== undefined && { ativo: alteracoes.ativo }),
      ...(alteracoes.especialidade !== undefined && { especialidade: alteracoes.especialidade || null }),
      ...(alteracoes.comissaoPercentual !== undefined && { comissao_percentual: alteracoes.comissaoPercentual }),
      ...(alteracoes.metaMensal !== undefined && { meta_mensal: alteracoes.metaMensal }),
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return mapRow(data)
}

export async function buscarPermissoesCatalogo(): Promise<PermissaoCatalogo[]> {
  const { data, error } = await supabase.from('permissoes').select('*').order('categoria').order('descricao')
  if (error) throw new Error(error.message)
  return (data ?? []).map((row: any) => ({ id: row.id, codigo: row.codigo, descricao: row.descricao, categoria: row.categoria }))
}

export async function buscarPermissoesDoFuncionario(funcionarioId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('funcionario_permissoes')
    .select('permissoes (codigo)')
    .eq('funcionario_id', funcionarioId)

  if (error) throw new Error(error.message)
  return (data ?? []).flatMap((row: any) => (row.permissoes?.codigo ? [row.permissoes.codigo] : []))
}

export async function definirPermissoesFuncionario(
  funcionarioId: string,
  codigos: string[],
  executorId: string,
): Promise<void> {
  const ip = await capturarIpPublico()
  const { error } = await supabase.rpc('funcionario_definir_permissoes', {
    p_funcionario_id: funcionarioId,
    p_codigos: codigos,
    p_executor_id: executorId,
    p_ip: ip,
  })
  if (error) throw new Error(traduzirErro(error.message))
}

export async function listarHistoricoFuncionario(funcionarioId: string): Promise<HistoricoFuncionarioEntry[]> {
  const { data, error } = await supabase
    .from('funcionarios_historico')
    .select('*, alterado_por:funcionarios!funcionarios_historico_alterado_por_fkey (nome)')
    .eq('funcionario_id', funcionarioId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map((row: any) => ({
    id: row.id,
    funcionarioId: row.funcionario_id,
    alteradoPorNome: row.alterado_por?.nome ?? null,
    acao: row.acao,
    detalhes: row.detalhes,
    ip: row.ip,
    createdAt: row.created_at,
  }))
}
