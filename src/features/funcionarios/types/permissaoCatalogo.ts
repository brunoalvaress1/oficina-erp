export interface PermissaoCatalogo {
  id: string
  codigo: string
  descricao: string
  categoria: string
}

export interface HistoricoFuncionarioEntry {
  id: string
  funcionarioId: string
  alteradoPorNome: string | null
  acao: string
  detalhes: { antes?: string[]; depois?: string[] } | null
  ip: string | null
  createdAt: string
}
