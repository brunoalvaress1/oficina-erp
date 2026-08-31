export type TipoNotaFiscal = 'nfce' | 'nfe' | 'nfse'
export type AmbienteNotaFiscal = 'homologacao' | 'producao'
export type StatusNotaFiscal = 'pendente' | 'processando' | 'autorizada' | 'rejeitada' | 'cancelada' | 'erro'

export const ROTULO_STATUS_NOTA_FISCAL: Record<StatusNotaFiscal, string> = {
  pendente: 'Pendente',
  processando: 'Processando',
  autorizada: 'Autorizada',
  rejeitada: 'Rejeitada',
  cancelada: 'Cancelada',
  erro: 'Erro',
}

export interface NotaFiscalSaida {
  id: string
  oficinaId: string
  caixaLancamentoId: string | null
  ordemServicoId: string | null
  ordemNumero: number | null
  tipo: TipoNotaFiscal
  ambiente: AmbienteNotaFiscal
  status: StatusNotaFiscal
  referencia: string | null
  numero: number | null
  serie: number | null
  chaveAcesso: string | null
  protocoloAutorizacao: string | null
  urlDanfe: string | null
  urlXml: string | null
  qrcodeUrl: string | null
  mensagemErro: string | null
  valorTotal: number
  clienteNome: string | null
  criadoPorNome: string | null
  createdAt: string
  updatedAt: string
}

export interface HistoricoNotaFiscalEntry {
  id: string
  notaFiscalId: string
  statusAnterior: string | null
  statusNovo: string
  mensagem: string | null
  createdAt: string
}

export type CampoOrdenacaoNotaFiscal = 'createdAt' | 'clienteNome' | 'ordemNumero'

export interface ListarNotasFiscaisParams {
  page?: number
  pageSize?: number
  status?: StatusNotaFiscal
  // Peça (nfce+nfe) x Serviço (nfse) — os dois documentos são coisas
  // fiscalmente diferentes (ICMS estadual x ISS municipal), não fica bem
  // misturado numa lista só.
  modelo?: ModeloNotaFiscal
  dataInicio?: string
  dataFim?: string
  search?: string
  sortBy?: CampoOrdenacaoNotaFiscal
  sortDirection?: 'asc' | 'desc'
}

export interface ListarNotasFiscaisResult {
  data: NotaFiscalSaida[]
  total: number
  page: number
  pageSize: number
}

export interface ResumoNotasFiscaisPeriodo {
  quantidade: number
  valorTotal: number
}

export interface OrdemPagaParaEmitir {
  ordemServicoId: string
  ordemNumero: number
  clienteNome: string | null
  valorTotal: number
  caixaLancamentoId: string
  dataPagamento: string | null
  pecaPendente: boolean
  servicoPendente: boolean
  valorPecas: number
  valorServicos: number
  // Campos do cadastro do cliente que faltam pra essa nota não ser rejeitada
  // pela Sefaz/Focus — vazio quando está tudo certo. Calculado no mesmo
  // formato que os edge functions emitir-nota-fiscal/emitir-nfse já exigem,
  // pra avisar ANTES de tentar emitir (ver validarClienteParaNota).
  problemasPeca: string[]
  problemasServico: string[]
}

export type ModeloNotaFiscal = 'peca' | 'servico'

export interface ResultadoConsultaEmLote {
  notaId: string
  sucesso: boolean
  status?: StatusNotaFiscal
  erro?: string
}

export interface ResultadoEmissaoEmLote {
  ordemNumero: number
  sucesso: boolean
  erro?: string
}
