export interface Integracao {
  id: string
  oficinaId: string
  codigo: string
  nome: string
  status: boolean
  token: string | null
  apiKey: string | null
  config: Record<string, unknown> | null
  updatedAt: string
}

export interface NotificacaoConfig {
  id: string
  oficinaId: string
  tipo: string
  ativo: boolean
}

export const ROTULO_NOTIFICACAO: Record<string, string> = {
  baixo_estoque: 'Baixo estoque',
  os_parada: 'OS parada',
  conta_vencida: 'Conta vencida',
  produto_sem_estoque: 'Produto sem estoque',
  pendencias: 'Pendências',
  novos_clientes: 'Novos clientes',
}

export interface BackupEntry {
  id: string
  oficinaId: string
  funcionarioId: string | null
  funcionarioNome?: string | null
  tamanhoEstimado: string | null
  status: string
  observacoes: string | null
  createdAt: string
}

export interface ChangelogEntry {
  id: string
  oficinaId: string
  versao: string
  data: string
  descricao: string
  createdAt: string
}
