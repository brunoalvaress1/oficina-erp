export type StatusCaixaSessao = 'aberto' | 'fechado'

export interface CaixaSessao {
  id: string
  oficinaId: string
  funcionarioAberturaId: string | null
  funcionarioAberturaNome?: string | null
  funcionarioFechamentoId: string | null
  funcionarioFechamentoNome?: string | null
  valorAbertura: number
  status: StatusCaixaSessao
  observacoesAbertura: string | null
  observacoesFechamento: string | null
  valorContadoFechamento: number | null
  diferencaCaixa: number | null
  dataAbertura: string
  dataFechamento: string | null
  createdAt: string
}

export interface RecebimentoResumoSessao {
  ordemNumero: number
  clienteNome: string | null
  valorTotal: number
  createdAt: string
}

export interface ResumoSessaoCaixa {
  sessao: CaixaSessao
  totalDinheiro: number
  totalPix: number
  totalDebito: number
  totalCredito: number
  totalTransferencia: number
  totalCheque: number
  totalCrediario: number
  totalBoleto: number
  totalOutros: number
  totalGeral: number
  quantidadeRecebimentos: number
  valorEsperadoDinheiro: number
  lucroTotal: number
  recebimentos: RecebimentoResumoSessao[]
}
