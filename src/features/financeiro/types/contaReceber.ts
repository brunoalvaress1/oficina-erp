export type StatusContaReceber = 'pendente' | 'parcial' | 'recebido' | 'cancelado' | 'atrasado'

export const ROTULO_STATUS_CONTA_RECEBER: Record<StatusContaReceber, string> = {
  pendente: 'Pendente',
  parcial: 'Parcial',
  recebido: 'Recebido',
  cancelado: 'Cancelado',
  atrasado: 'Atrasado',
}

export interface ContaReceber {
  id: string
  oficinaId: string
  documento: string | null
  clienteId: string | null
  clienteNome: string | null
  clienteNomeAvulso: string | null
  descricao: string
  categoriaId: string | null
  categoriaNome: string | null
  centroCustoId: string | null
  centroCustoNome: string | null
  valor: number
  valorRecebido: number
  dataVencimento: string
  status: StatusContaReceber
  responsavelId: string | null
  responsavelNome: string | null
  observacoes: string | null
  createdAt: string
  updatedAt: string
}

export interface ContaReceberBaixa {
  id: string
  contaReceberId: string
  valor: number
  contaBancariaId: string | null
  contaBancariaNome: string | null
  formaPagamento: string | null
  dataRecebimento: string
  funcionarioId: string | null
  funcionarioNome: string | null
  observacoes: string | null
  createdAt: string
}

export interface CriarContaReceberInput {
  documento?: string
  clienteId?: string
  clienteNomeAvulso?: string
  descricao: string
  categoriaId?: string
  centroCustoId?: string
  valor: number
  dataVencimento: string
  observacoes?: string
}

export interface BaixarContaReceberInput {
  contaReceberId: string
  valor: number
  contaBancariaId?: string
  formaPagamento?: string
  dataRecebimento?: string
  categoriaId?: string
  observacoes?: string
}

export type FiltroStatusContaReceber = 'todas' | 'pendente' | 'parcial' | 'recebido' | 'atrasado' | 'cancelado'

export interface ListarContasReceberParams {
  page?: number
  pageSize?: number
  search?: string
  status?: FiltroStatusContaReceber
}

export interface ListarContasReceberResult {
  data: ContaReceber[]
  total: number
  page: number
  pageSize: number
}
