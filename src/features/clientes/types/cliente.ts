export interface Cliente {
  id: string
  oficinaId: string
  nome: string
  cpfCnpj: string | null
  telefone: string | null
  email: string | null
  cep: string | null
  endereco: string | null
  numero: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
  codigoCidade: string | null
  sexo: string | null
  dataNascimento: string | null
  observacoes: string | null
  inscricaoEstadual: string | null
  createdAt: string
  updatedAt: string
}

export interface ClienteInput {
  nome: string
  cpfCnpj?: string
  telefone?: string
  email?: string
  cep?: string
  endereco?: string
  numero?: string
  bairro?: string
  cidade?: string
  estado?: string
  codigoCidade?: string
  sexo?: string
  dataNascimento?: string
  observacoes?: string
  inscricaoEstadual?: string
}

export type CampoOrdenacaoCliente =
  | 'nome'
  | 'cpfCnpj'
  | 'telefone'
  | 'cidade'
  | 'email'
  | 'endereco'
  | 'cep'
  | 'codigoCidade'

export interface ListarClientesParams {
  page?: number
  pageSize?: number
  search?: string
  sortBy?: CampoOrdenacaoCliente
  sortDirection?: 'asc' | 'desc'
}

export interface ListarClientesResult {
  data: Cliente[]
  total: number
  page: number
  pageSize: number
}
