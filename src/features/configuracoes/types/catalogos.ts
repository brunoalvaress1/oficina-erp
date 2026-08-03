export type TabelaCatalogo = 'categorias_produtos' | 'categorias_servicos' | 'categorias_fornecedores' | 'categorias_clientes' | 'categorias_veiculos'

export interface ItemCatalogo {
  id: string
  oficinaId: string
  nome: string
  ativo: boolean
  createdAt: string
}

export interface Imposto {
  id: string
  oficinaId: string
  nome: string
  ncm: string | null
  cest: string | null
  cfop: string | null
  icmsPercentual: number | null
  ipiPercentual: number | null
  pisPercentual: number | null
  cofinsPercentual: number | null
  stPercentual: number | null
  classeFiscal: string | null
  origem: string | null
  ativo: boolean
  createdAt: string
}

export type ImpostoInput = Omit<Imposto, 'id' | 'oficinaId' | 'createdAt'>
