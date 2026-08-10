export type StatusAssinatura = 'ativa' | 'bloqueada'

export interface OficinaAdmin {
  id: string
  nomeFantasia: string | null
  razaoSocial: string | null
  cnpj: string | null
  email: string | null
  statusAssinatura: StatusAssinatura
  bloqueadaEm: string | null
  bloqueadaMotivo: string | null
  vencimentoMensalidade: string | null
  valorMensalidade: number | null
  createdAt: string
  qtdFuncionarios: number
}

export interface CriarOficinaInput {
  nomeFantasia: string
  razaoSocial?: string
  cnpj?: string
  emailAdmin: string
  senhaAdmin: string
  nomeAdmin: string
}
