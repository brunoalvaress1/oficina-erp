export interface ProdutoCsvRow {
  linha: number
  nome?: string
  categoria?: string
  subcategoria?: string
  marca?: string
  codigoFabricante?: string
  codigoInterno?: string
  valorCusto?: string
  valorOs?: string
  estoqueFisico?: string
  ncm?: string
  observacoes?: string
}

export interface LinhaImportacaoProdutoPreview {
  linha: number
  dados: ProdutoCsvRow
  status: 'valido' | 'erro' | 'duplicado'
  erros: string[]
}

export interface ResultadoImportacaoProduto {
  totalLinhas: number
  importados: number
  falhas: number
  erros: { linha: number; mensagem: string }[]
}
