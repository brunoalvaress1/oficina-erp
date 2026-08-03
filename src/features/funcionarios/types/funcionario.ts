export interface Funcionario {
  id: string
  userId: string
  oficinaId: string
  nome: string
  cargo: string | null
  email: string | null
  ativo: boolean
  createdAt: string
  quantidadePermissoes?: number
  especialidade?: string | null
  comissaoPercentual?: number | null
  metaMensal?: number | null
  fotoUrl?: string | null
}

export interface FuncionarioInput {
  nome: string
  cargo?: string
  email: string
  senha: string
}

export interface FuncionarioAtualizacaoInput {
  nome?: string
  cargo?: string
  ativo?: boolean
  especialidade?: string | null
  comissaoPercentual?: number | null
  metaMensal?: number | null
}

export interface ListarFuncionariosParams {
  page?: number
  pageSize?: number
  search?: string
}

export interface ListarFuncionariosResult {
  data: Funcionario[]
  total: number
  page: number
  pageSize: number
}
