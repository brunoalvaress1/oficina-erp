export type TipoCategoriaFinanceira = 'receita' | 'despesa' | 'ambos'

export interface CategoriaFinanceira {
  id: string
  oficinaId: string
  nome: string
  tipo: TipoCategoriaFinanceira
  ativo: boolean
  createdAt: string
}
