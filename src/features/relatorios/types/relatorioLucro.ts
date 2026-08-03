export interface LucroPeca {
  produtoId: string | null
  descricao: string
  tipo: 'produto_estoque' | 'produto_terceirizado'
  quantidade: number
  valorVendido: number
  custoTotal: number
  lucro: number
  margemPercentual: number
}

export interface LucroServico {
  servicoId: string | null
  descricao: string
  quantidade: number
  valorVendido: number
  lucro: number
}
