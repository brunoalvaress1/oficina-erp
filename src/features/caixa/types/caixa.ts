export type StatusCaixaLancamento = 'aguardando' | 'pendente' | 'recebido' | 'cancelado'

export type FormaPagamento =
  | 'dinheiro'
  | 'pix'
  | 'debito'
  | 'credito'
  | 'transferencia'
  | 'cheque'
  | 'crediario'
  | 'boleto'
  | 'outros'

export const ROTULO_FORMA_PAGAMENTO: Record<FormaPagamento, string> = {
  dinheiro: 'Dinheiro',
  pix: 'PIX',
  debito: 'Débito',
  credito: 'Crédito',
  transferencia: 'Transferência',
  cheque: 'Cheque',
  crediario: 'Crediário',
  boleto: 'Boleto',
  outros: 'Outros',
}

export interface CaixaLancamento {
  id: string
  oficinaId: string
  ordemServicoId: string
  status: StatusCaixaLancamento
  observacoes: string | null
  createdAt: string
  updatedAt: string
  // dados vindos do join com ordens_servico (+ cliente/veículo)
  ordemNumero: number
  ordemNumeroPrisma: string | null
  clienteId: string
  clienteNome: string | null
  clienteTelefone: string | null
  veiculoPlaca: string | null
  veiculoModelo: string | null
  responsavelNome: string | null
  valorTotal: number
  valorDesconto: number
  descontoRecebimento: number
  dataAbertura: string
}

export interface CaixaRecebimentoForma {
  id: string
  caixaRecebimentoId: string
  formaPagamento: FormaPagamento
  valor: number
  valorRecebido: number | null
  contaBancariaId: string | null
  contaBancariaNome?: string | null
  parcelas: number | null
  bandeira: string | null
  maquininha: string | null
  jurosPercentual: number | null
  valorLiquido: number | null
  createdAt: string
}

export interface CaixaRecebimento {
  id: string
  caixaLancamentoId: string
  funcionarioId: string | null
  funcionarioNome?: string | null
  valorTotal: number
  cancelado: boolean
  motivoCancelamento: string | null
  canceladoPor: string | null
  canceladoEm: string | null
  createdAt: string
}

export interface CaixaLancamentoHistoricoEntry {
  id: string
  caixaLancamentoId: string
  funcionarioId: string | null
  funcionarioNome?: string | null
  acao: string
  detalhes: Record<string, unknown> | null
  ip: string | null
  createdAt: string
}

export interface CaixaLancamentoDetalhe {
  lancamento: CaixaLancamento
  recebimentos: CaixaRecebimento[]
  historico: CaixaLancamentoHistoricoEntry[]
}

export type FiltroCaixa = 'todas' | 'aguardando' | 'pendente' | 'recebidas_hoje' | 'recebidas_periodo'

export interface ListarCaixaParams {
  page?: number
  pageSize?: number
  search?: string
  filtro?: FiltroCaixa
  dataInicio?: string
  dataFim?: string
}

export interface ListarCaixaResult {
  data: CaixaLancamento[]
  total: number
  page: number
  pageSize: number
}

export interface HistoricoCaixaFeedEntry extends CaixaLancamentoHistoricoEntry {
  ordemServicoId: string | null
  ordemNumero: number
  clienteNome: string | null
}

export interface ListarHistoricoCaixaParams {
  page?: number
  pageSize?: number
  search?: string
}

export interface ListarHistoricoCaixaResult {
  data: HistoricoCaixaFeedEntry[]
  total: number
  page: number
  pageSize: number
}

export interface FormaPagamentoInput {
  formaPagamento: FormaPagamento
  valor: number
  valorRecebido?: number
  contaBancariaId?: string
  parcelas?: number
  bandeira?: string
  maquininha?: string
  jurosPercentual?: number
}

export interface DashboardCaixa {
  recebidoHoje: number
  recebidoPix: number
  recebidoDinheiro: number
  recebidoDebito: number
  recebidoCredito: number
  recebidoBoleto: number
  pendentes: number
  quantidadeOs: number
  totalGeral: number
  descontosHoje: number
}
