import type { FormaPagamento } from '@/features/caixa/types/caixa'

export type TipoMovimentacao = 'entrada' | 'saida'
export type OrigemMovimentacao = 'os' | 'pdv' | 'despesa_manual' | 'receita_manual' | 'ajuste' | 'transferencia'

export const ROTULO_ORIGEM_MOVIMENTACAO: Record<OrigemMovimentacao, string> = {
  os: 'Ordem de Serviço',
  pdv: 'PDV',
  despesa_manual: 'Despesa Manual',
  receita_manual: 'Receita Manual',
  ajuste: 'Ajuste',
  transferencia: 'Transferência',
}

export interface MovimentacaoFinanceira {
  id: string
  oficinaId: string
  dataMovimentacao: string
  descricao: string
  tipo: TipoMovimentacao
  origem: OrigemMovimentacao
  contaBancariaId: string | null
  contaBancariaNome: string | null
  formaPagamento: FormaPagamento | null
  valorBruto: number
  taxa: number
  valorLiquido: number
  categoriaId: string | null
  categoriaNome: string | null
  centroCustoId: string | null
  centroCustoNome: string | null
  responsavelId: string | null
  responsavelNome: string | null
  referenciaTipo: string | null
  referenciaId: string | null
  conciliado: boolean
  valorConciliado: number | null
  conciliadoEm: string | null
  createdAt: string
}

export interface ListarMovimentacoesParams {
  page?: number
  pageSize?: number
  search?: string
  dataInicio?: string
  dataFim?: string
  tipo?: TipoMovimentacao
  origem?: OrigemMovimentacao
  contaBancariaId?: string | null
  formaPagamento?: string | null
  categoriaId?: string | null
  centroCustoId?: string | null
  responsavelId?: string | null
  apenasComRegistroDivergencia?: boolean
}

export interface ListarMovimentacoesResult {
  data: MovimentacaoFinanceira[]
  total: number
  page: number
  pageSize: number
}
