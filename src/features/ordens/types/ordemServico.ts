export type StatusOrdemServico =
  | 'em_aberto'
  | 'em_execucao'
  | 'aguardando_aprovacao'
  | 'aguardando_pecas'
  | 'finalizada'
  | 'enviada_caixa'
  | 'paga'
  | 'cancelada'

export type TipoItemOrdem = 'produto_estoque' | 'produto_terceirizado' | 'servico'

export type StatusAprovacaoItem = 'aguardando' | 'aprovado' | 'recusado'

export interface OrdemServico {
  id: string
  numero: number
  oficinaId: string
  numeroPrisma: string | null
  clienteId: string
  clienteNome?: string
  veiculoId: string | null
  veiculoPlaca?: string
  veiculoModelo?: string
  responsavelId: string
  responsavelNome?: string
  mecanicoId: string | null
  mecanicoNome?: string
  dataAbertura: string
  dataEntrada: string
  kmAtual: number | null
  kmAnterior: number | null
  status: StatusOrdemServico
  defeitosRelatados: string | null
  observacoesInternas: string | null
  valorProdutos: number
  valorServicos: number
  valorDesconto: number
  valorTotal: number
  criadoPor: string | null
  createdAt: string
  updatedAt: string
}

export interface OrdemServicoItem {
  id: string
  ordemServicoId: string
  tipo: TipoItemOrdem
  produtoId: string | null
  produtoNome?: string | null
  servicoId: string | null
  fornecedorId: string | null
  fornecedorNome?: string | null
  numeroNota: string | null
  descricao: string
  quantidade: number
  valorUnitario: number
  valorCusto: number | null
  valorDesconto: number
  valorTotal: number
  statusAprovacao: StatusAprovacaoItem
  observacoes: string | null
  createdAt: string
  updatedAt: string
}

export interface OrdemServicoHistoricoEntry {
  id: string
  ordemServicoId: string
  funcionarioId: string | null
  funcionarioNome?: string | null
  acao: string
  detalhes: Record<string, unknown> | null
  ip: string | null
  createdAt: string
}

export interface OrdemServicoDetalhe {
  ordem: OrdemServico
  itens: OrdemServicoItem[]
  historico: OrdemServicoHistoricoEntry[]
}

export interface ItemOrdemInput {
  tipo: TipoItemOrdem
  produtoId?: string
  servicoId?: string
  fornecedorId?: string
  numeroNota?: string
  descricao: string
  quantidade: number
  valorUnitario: number
  valorCusto?: number
  valorDesconto?: number
  observacoes?: string
}

export interface CriarOrdemServicoInput {
  clienteId: string
  veiculoId?: string
  responsavelId: string
  mecanicoId?: string
  numeroPrisma?: string
  dataAbertura: string
  dataEntrada: string
  kmAtual?: number
  defeitosRelatados?: string
  observacoesInternas?: string
  itens: ItemOrdemInput[]
}

export interface AtualizarCabecalhoInput {
  numeroPrisma?: string
  mecanicoId?: string
  status?: StatusOrdemServico
  kmAtual?: number
  defeitosRelatados?: string
  observacoesInternas?: string
  dataEntrada?: string
}

export type CampoOrdenacaoOrdem = 'numero' | 'dataAbertura' | 'status' | 'valorTotal'

export interface ListarOrdensParams {
  page?: number
  pageSize?: number
  search?: string
  status?: StatusOrdemServico | 'todas'
  numeroNota?: string
  veiculoId?: string
  dataAberturaInicio?: string
  dataAberturaFim?: string
  sortBy?: CampoOrdenacaoOrdem
  sortDirection?: 'asc' | 'desc'
}

export interface ListarOrdensResult {
  data: OrdemServico[]
  total: number
  page: number
  pageSize: number
}

export const ROTULO_STATUS_ORDEM: Record<StatusOrdemServico, string> = {
  em_aberto: 'Em Aberto',
  em_execucao: 'Em Execução',
  aguardando_aprovacao: 'Aguardando Aprovação',
  aguardando_pecas: 'Aguardando Peças',
  finalizada: 'Finalizada',
  enviada_caixa: 'Enviada ao Caixa',
  paga: 'Paga',
  cancelada: 'Cancelada',
}

export const COR_STATUS_ORDEM: Record<StatusOrdemServico, string> = {
  em_aberto: 'bg-blue-100 text-blue-700',
  em_execucao: 'bg-indigo-100 text-indigo-700',
  aguardando_aprovacao: 'bg-amber-100 text-amber-700',
  aguardando_pecas: 'bg-orange-100 text-orange-700',
  finalizada: 'bg-teal-100 text-teal-700',
  enviada_caixa: 'bg-green-100 text-green-700',
  paga: 'bg-emerald-100 text-emerald-700',
  cancelada: 'bg-red-100 text-red-700',
}
