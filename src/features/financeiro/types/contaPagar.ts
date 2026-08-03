export type StatusContaPagar = 'pendente' | 'parcial' | 'pago' | 'cancelado' | 'atrasado'

export const ROTULO_STATUS_CONTA_PAGAR: Record<StatusContaPagar, string> = {
  pendente: 'Pendente',
  parcial: 'Parcial',
  pago: 'Pago',
  cancelado: 'Cancelado',
  atrasado: 'Atrasado',
}

export interface ContaPagar {
  id: string
  oficinaId: string
  fornecedorId: string | null
  fornecedorNome: string | null
  descricao: string
  categoriaId: string | null
  categoriaNome: string | null
  centroCustoId: string | null
  centroCustoNome: string | null
  valor: number
  valorPago: number
  dataVencimento: string
  status: StatusContaPagar
  responsavelId: string | null
  responsavelNome: string | null
  observacoes: string | null
  createdAt: string
  updatedAt: string
}

export interface ContaPagarBaixa {
  id: string
  contaPagarId: string
  valor: number
  contaBancariaId: string | null
  contaBancariaNome: string | null
  formaPagamento: string | null
  dataPagamento: string
  funcionarioId: string | null
  funcionarioNome: string | null
  observacoes: string | null
  createdAt: string
}

export interface CriarContaPagarInput {
  fornecedorId?: string
  descricao: string
  categoriaId?: string
  centroCustoId?: string
  valor: number
  dataVencimento: string
  observacoes?: string
}

export interface BaixarContaPagarInput {
  contaPagarId: string
  valor: number
  contaBancariaId?: string
  formaPagamento?: string
  dataPagamento?: string
  categoriaId?: string
  observacoes?: string
}

export type FiltroStatusContaPagar = 'todas' | 'pendente' | 'parcial' | 'pago' | 'atrasado' | 'cancelado'

export interface ListarContasPagarParams {
  page?: number
  pageSize?: number
  search?: string
  status?: FiltroStatusContaPagar
}

export interface ListarContasPagarResult {
  data: ContaPagar[]
  total: number
  page: number
  pageSize: number
}
