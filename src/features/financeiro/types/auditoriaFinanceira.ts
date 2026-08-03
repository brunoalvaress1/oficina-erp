export type EntidadeFinanceira = 'conta_receber' | 'conta_pagar' | 'transferencia' | 'movimentacao' | 'meta'

export const ROTULO_ENTIDADE_FINANCEIRA: Record<EntidadeFinanceira, string> = {
  conta_receber: 'Conta a Receber',
  conta_pagar: 'Conta a Pagar',
  transferencia: 'Transferência',
  movimentacao: 'Movimentação',
  meta: 'Meta',
}

export interface HistoricoFinanceiroEntry {
  id: string
  entidade: EntidadeFinanceira
  entidadeId: string
  funcionarioId: string | null
  funcionarioNome: string | null
  acao: string
  detalhes: Record<string, unknown> | null
  ip: string | null
  createdAt: string
}

export interface ListarHistoricoFinanceiroParams {
  page?: number
  pageSize?: number
  entidade?: EntidadeFinanceira
  funcionarioId?: string
  dataInicio?: string
  dataFim?: string
}

export interface ListarHistoricoFinanceiroResult {
  data: HistoricoFinanceiroEntry[]
  total: number
  page: number
  pageSize: number
}
