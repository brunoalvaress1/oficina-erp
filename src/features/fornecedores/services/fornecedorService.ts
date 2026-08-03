import { supabase } from '@/lib/supabase'
import type {
  CampoOrdenacaoFornecedor,
  Fornecedor,
  FornecedorInput,
  FornecedorSelect,
  ListarFornecedoresParams,
  ListarFornecedoresResult,
} from '../types/fornecedor'

const COLUNA_POR_CAMPO: Record<CampoOrdenacaoFornecedor, string> = {
  nome: 'nome',
  cnpjCpf: 'cnpj_cpf',
  telefone: 'telefone',
  email: 'email',
  endereco: 'endereco',
  vendedor: 'vendedor',
}

function mapRow(row: any): Fornecedor {
  return {
    id: row.id,
    oficinaId: row.oficina_id,
    nome: row.nome,
    cnpjCpf: row.cnpj_cpf,
    vendedor: row.vendedor,
    telefone: row.telefone,
    email: row.email,
    endereco: row.endereco,
    observacoes: row.observacoes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listarFornecedores(params: ListarFornecedoresParams = {}): Promise<ListarFornecedoresResult> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 20
  const search = params.search?.trim() ?? ''

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase.from('fornecedores').select('*', { count: 'exact' })

  if (search) {
    const termo = search.replace(/,/g, ' ')
    query = query.or(
      `nome.ilike.%${termo}%,cnpj_cpf.ilike.%${termo}%,email.ilike.%${termo}%,telefone.ilike.%${termo}%,vendedor.ilike.%${termo}%`,
    )
  }

  const coluna = COLUNA_POR_CAMPO[params.sortBy ?? 'nome']
  const ascendente = params.sortDirection !== 'desc'

  const { data, count, error } = await query.order(coluna, { ascending: ascendente }).range(from, to)
  if (error) throw new Error(error.message)

  return {
    data: (data ?? []).map(mapRow),
    total: count ?? 0,
    page,
    pageSize,
  }
}

export async function listarFornecedoresSelect(search = ''): Promise<FornecedorSelect[]> {
  let query = supabase.from('fornecedores').select('id, nome, cnpj_cpf').order('nome').limit(20)
  if (search.trim()) {
    query = query.ilike('nome', `%${search.trim()}%`)
  }
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => ({ id: row.id, nome: row.nome, cnpjCpf: row.cnpj_cpf }))
}

export async function criarFornecedor(input: FornecedorInput, oficinaId: string): Promise<Fornecedor> {
  const { data, error } = await supabase
    .from('fornecedores')
    .insert({
      oficina_id: oficinaId,
      nome: input.nome,
      cnpj_cpf: input.cnpjCpf || null,
      vendedor: input.vendedor || null,
      telefone: input.telefone || null,
      email: input.email || null,
      endereco: input.endereco || null,
      observacoes: input.observacoes || null,
    })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return mapRow(data)
}

export async function atualizarFornecedor(id: string, input: FornecedorInput): Promise<Fornecedor> {
  const { data, error } = await supabase
    .from('fornecedores')
    .update({
      nome: input.nome,
      cnpj_cpf: input.cnpjCpf || null,
      vendedor: input.vendedor || null,
      telefone: input.telefone || null,
      email: input.email || null,
      endereco: input.endereco || null,
      observacoes: input.observacoes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return mapRow(data)
}

export async function excluirFornecedor(id: string): Promise<void> {
  const { error } = await supabase.from('fornecedores').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
