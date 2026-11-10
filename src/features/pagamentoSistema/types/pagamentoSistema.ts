export interface InfoPagamentoSistema {
  nomeFantasia: string | null
  vencimentoMensalidade: string | null
  valorMensalidade: number | null
  statusAssinatura: 'ativa' | 'bloqueada'
  bloqueadaMotivo: string | null
}

export interface FuncionalidadePlataforma {
  ativo: boolean
  mensagem: string
}

// Configuração global da plataforma (não é por oficina) — editável só pelo
// super admin, lida por toda oficina (mesmo bloqueada).
export interface ConfigPlataforma {
  chavePix: string | null
  mensagemUrgencia: string | null
  funcionalidades: Record<string, FuncionalidadePlataforma>
}
