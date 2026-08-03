import { supabase } from '@/lib/supabase'
import type {
  CampoOrdenacaoCliente,
  Cliente,
  ClienteInput,
  ListarClientesParams,
  ListarClientesResult,
} from '../types/cliente'

const COLUNA_POR_CAMPO: Record<CampoOrdenacaoCliente, string> = {
  nome: 'nome',
  cpfCnpj: 'cpf_cnpj',
  telefone: 'telefone',
  cidade: 'cidade',
  email: 'email',
  endereco: 'endereco',
  cep: 'cep',
  codigoCidade: 'codigo_cidade',
}

function mapRow(row: any): Cliente {
  return {
    id: row.id,
    oficinaId: row.oficina_id,
    nome: row.nome,
    cpfCnpj: row.cpf_cnpj,
    telefone: row.telefone,
    email: row.email,
    cep: row.cep,
    endereco: row.endereco,
    numero: row.numero,
    bairro: row.bairro,
    cidade: row.cidade,
    estado: row.estado,
    codigoCidade: row.codigo_cidade,
    sexo: row.sexo,
    dataNascimento: row.data_nascimento,
    observacoes: row.observacoes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listarClientes(params: ListarClientesParams = {}): Promise<ListarClientesResult> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 20
  const search = params.search?.trim() ?? ''

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase.from('clientes').select('*', { count: 'exact' })

  if (search) {
    const termo = search.replace(/,/g, ' ')
    query = query.or(
      `nome.ilike.%${termo}%,cpf_cnpj.ilike.%${termo}%,email.ilike.%${termo}%,endereco.ilike.%${termo}%,cep.ilike.%${termo}%`,
    )
  }

  const colunaOrdenacao = COLUNA_POR_CAMPO[params.sortBy ?? 'nome']
  const ascendente = params.sortDirection !== 'desc'

  const { data, count, error } = await query
    .order(colunaOrdenacao, { ascending: ascendente })
    .range(from, to)

  if (error) throw new Error(error.message)

  return {
    data: (data ?? []).map(mapRow),
    total: count ?? 0,
    page,
    pageSize,
  }
}

export async function buscarClientePorId(id: string): Promise<Cliente> {
  const { data, error } = await supabase.from('clientes').select('*').eq('id', id).single()

  if (error) throw new Error(error.message)
  return mapRow(data)
}

// cpf_cnpj é salvo já formatado (com pontuação) — quem chama deve formatar o valor
// digitado do mesmo jeito (formatCpfCnpj) antes de buscar, pra bater com o que está salvo.
export async function buscarClientePorCpfCnpj(cpfCnpjFormatado: string): Promise<Cliente | null> {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('cpf_cnpj', cpfCnpjFormatado)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data ? mapRow(data) : null
}

export async function criarCliente(input: ClienteInput, oficinaId: string): Promise<Cliente> {
  const { data, error } = await supabase
    .from('clientes')
    .insert({
      oficina_id: oficinaId,
      nome: input.nome,
      cpf_cnpj: input.cpfCnpj || null,
      telefone: input.telefone || null,
      email: input.email || null,
      cep: input.cep || null,
      endereco: input.endereco || null,
      numero: input.numero || null,
      bairro: input.bairro || null,
      cidade: input.cidade || null,
      estado: input.estado || null,
      codigo_cidade: input.codigoCidade || null,
      sexo: input.sexo || null,
      data_nascimento: input.dataNascimento || null,
      observacoes: input.observacoes || null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return mapRow(data)
}

export async function atualizarCliente(id: string, input: ClienteInput): Promise<Cliente> {
  const { data, error } = await supabase
    .from('clientes')
    .update({
      nome: input.nome,
      cpf_cnpj: input.cpfCnpj || null,
      telefone: input.telefone || null,
      email: input.email || null,
      cep: input.cep || null,
      endereco: input.endereco || null,
      numero: input.numero || null,
      bairro: input.bairro || null,
      cidade: input.cidade || null,
      estado: input.estado || null,
      codigo_cidade: input.codigoCidade || null,
      sexo: input.sexo || null,
      data_nascimento: input.dataNascimento || null,
      observacoes: input.observacoes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return mapRow(data)
}

export async function excluirCliente(id: string): Promise<void> {
  const { error } = await supabase.from('clientes').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function listarClientesSelect() {
  const { data, error } = await supabase
    .from('clientes')
    .select('id, nome')
    .order('nome')

  if (error) throw new Error(error.message)

  return data ?? []
}

export async function buscarClientes(search: string) {
  let query = supabase
    .from('clientes')
    .select('id, nome, cpf_cnpj, telefone')
    .order('nome')
    .limit(20)

  if (search.trim()) {
    const termo = search.trim()
    query = query.or(
      `nome.ilike.%${termo}%,cpf_cnpj.ilike.%${termo}%,telefone.ilike.%${termo}%`,
    )
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}