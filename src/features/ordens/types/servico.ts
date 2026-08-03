export interface Servico {
  id: string
  oficinaId: string
  nome: string
  valorPadrao: number
  categoriaId: string | null
  categoriaNome?: string | null
  tempoMedioMinutos: number | null
  descricao: string | null
  ativo: boolean
  createdAt: string
  updatedAt: string
}

export interface ServicoInput {
  nome: string
  valorPadrao?: number
  categoriaId?: string | null
  tempoMedioMinutos?: number | null
  descricao?: string | null
  ativo?: boolean
}
