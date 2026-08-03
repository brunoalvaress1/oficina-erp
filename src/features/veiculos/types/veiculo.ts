export interface Veiculo {
  id: string
  oficinaId: string
  clienteId: string
  clienteNome?: string
  placa: string
  marca: string | null
  modelo: string
  cor: string | null
  ano: string | null
  anoModelo: string | null
  chassi: string | null
  kmAtual: number | null
  combustivel: string | null
  motor: string | null
  opcionais: string | null
  observacoes: string | null
  createdAt: string
  updatedAt: string
}

export interface VeiculoInput {
  clienteId: string
  placa: string
  marca?: string
  modelo: string
  cor?: string
  ano?: string
  anoModelo?: string
  chassi?: string
  kmAtual?: number
  combustivel?: string
  motor?: string
  opcionais?: string
  observacoes?: string
}

export type CampoOrdenacaoVeiculo = 'placa' | 'modelo' | 'marca' | 'clienteNome'

export interface ListarVeiculosParams {
  page?: number
  pageSize?: number
  search?: string
  sortBy?: CampoOrdenacaoVeiculo
  sortDirection?: 'asc' | 'desc'
}

export interface ListarVeiculosResult {
  data: Veiculo[]
  total: number
  page: number
  pageSize: number
}