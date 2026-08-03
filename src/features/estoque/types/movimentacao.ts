export type TipoMovimentacao = 'entrada' | 'saida' | 'ajuste' | 'transferencia'

export interface EstoqueMovimentacao {
  id: string
  oficinaId: string
  produtoId: string
  produtoNome: string | null
  tipo: TipoMovimentacao
  quantidade: number
  quantidadeAnterior: number
  quantidadeResultante: number
  notaFiscalId: string | null
  numeroNota: string | null
  funcionarioId: string | null
  funcionarioNome: string | null
  observacao: string | null
  createdAt: string
}

export interface ListarMovimentacoesParams {
  page?: number
  pageSize?: number
  tipo?: TipoMovimentacao
  produtoId?: string
  fornecedorId?: string
  numeroNota?: string
  funcionarioId?: string
  dataInicio?: string
  dataFim?: string
}

export interface ListarMovimentacoesResult {
  data: EstoqueMovimentacao[]
  total: number
  page: number
  pageSize: number
}
