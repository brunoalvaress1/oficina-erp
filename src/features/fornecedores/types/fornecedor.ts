export interface Fornecedor {
  id: string
  oficinaId: string
  nome: string
  cnpjCpf: string | null
  vendedor: string | null
  telefone: string | null
  email: string | null
  endereco: string | null
  observacoes: string | null
  createdAt: string
  updatedAt: string
}

export type FornecedorSelect = Pick<Fornecedor, 'id' | 'nome' | 'cnpjCpf'>

export interface FornecedorInput {
  nome: string
  cnpjCpf?: string
  vendedor?: string
  telefone?: string
  email?: string
  endereco?: string
  observacoes?: string
}

export type CampoOrdenacaoFornecedor = 'nome' | 'cnpjCpf' | 'telefone' | 'email' | 'endereco' | 'vendedor'

export interface ListarFornecedoresParams {
  page?: number
  pageSize?: number
  search?: string
  sortBy?: CampoOrdenacaoFornecedor
  sortDirection?: 'asc' | 'desc'
}

export interface ListarFornecedoresResult {
  data: Fornecedor[]
  total: number
  page: number
  pageSize: number
}
