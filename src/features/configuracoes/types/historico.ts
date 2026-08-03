export interface HistoricoConfiguracaoEntry {
  id: string
  entidade: string
  entidadeId: string | null
  funcionarioNome: string | null
  acao: string
  detalhes: Record<string, unknown> | null
  ip: string | null
  createdAt: string
}
