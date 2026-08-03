export interface Produto {
  id: string
  oficinaId: string
  nome: string
  categoria: string | null
  subcategoria: string | null
  marca: string | null
  codigoFabricante: string | null
  codigoInterno: string | null
  valorCusto: number
  custoMedio: number
  valorOs: number
  estoqueFisico: number
  estoqueMinimo: number | null
  estoqueIdeal: number | null
  codigoBarras: string | null
  ncm: string | null
  impostoId: string | null
  impostoNome?: string | null
  observacoes: string | null
  createdAt: string
  updatedAt: string
}

export interface ProdutoInput {
  nome: string
  categoria?: string
  subcategoria?: string
  marca?: string
  codigoFabricante?: string
  codigoInterno?: string
  valorCusto?: number
  custoMedio?: number
  valorOs?: number
  estoqueFisico?: number
  estoqueMinimo?: number
  estoqueIdeal?: number
  codigoBarras?: string
  ncm?: string
  impostoId?: string | null
  observacoes?: string
}

export type CampoOrdenacaoProduto =
  | 'nome'
  | 'categoria'
  | 'marca'
  | 'valorCusto'
  | 'valorOs'
  | 'estoqueFisico'
  | 'ncm'

export interface ListarProdutosParams {
  page?: number
  pageSize?: number
  search?: string
  sortBy?: CampoOrdenacaoProduto
  sortDirection?: 'asc' | 'desc'
}

export interface ListarProdutosResult {
  data: Produto[]
  total: number
  page: number
  pageSize: number
}
