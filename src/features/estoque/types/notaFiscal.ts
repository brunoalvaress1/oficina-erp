export interface NotaFiscalItemInput {
  produtoId: string
  quantidade: number
  valorCustoAtual: number
  valorVendaOs?: number
  ncm?: string
  cest?: string
  cfop?: string
  classeImposto?: string
  origem?: string
  situacaoTributaria?: string
  cstPisCofins?: string
  cstIpi?: string
  observacoes?: string
}

export interface LancarEstoqueInput {
  fornecedorId: string
  numeroNota: string
  dataNota: string
  dataEntrada: string
  observacoes?: string
  itens: NotaFiscalItemInput[]
}

export interface NotaFiscalEntrada {
  id: string
  oficinaId: string
  fornecedorId: string
  fornecedorNome: string | null
  numeroNota: string
  dataNota: string
  dataEntrada: string
  valorProdutos: number
  observacoes: string | null
  criadoPor: string | null
  criadoPorNome: string | null
  createdAt: string
  updatedAt: string
}

export interface NotaFiscalItem {
  id: string
  notaFiscalId: string
  produtoId: string
  produtoNome: string | null
  quantidade: number
  valorCustoAnterior: number | null
  valorCustoAtual: number
  custoMedioResultante: number | null
  valorVendaOs: number | null
  ncm: string | null
  cest: string | null
  cfop: string | null
  classeImposto: string | null
  origem: string | null
  situacaoTributaria: string | null
  cstPisCofins: string | null
  cstIpi: string | null
  observacoes: string | null
  createdAt: string
}

export interface NotaFiscalHistoricoEntry {
  id: string
  notaFiscalId: string
  funcionarioId: string | null
  funcionarioNome: string | null
  acao: string
  detalhes: Record<string, unknown> | null
  ip: string | null
  createdAt: string
}

export interface NotaFiscalDetalhe {
  nota: NotaFiscalEntrada
  itens: NotaFiscalItem[]
  historico: NotaFiscalHistoricoEntry[]
}

export interface ListarNotasFiscaisParams {
  page?: number
  pageSize?: number
  search?: string
}

export interface ListarNotasFiscaisResult {
  data: NotaFiscalEntrada[]
  total: number
  page: number
  pageSize: number
}
