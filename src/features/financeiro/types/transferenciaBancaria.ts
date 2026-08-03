export interface TransferenciaBancaria {
  id: string
  oficinaId: string
  contaOrigemId: string
  contaOrigemNome: string | null
  contaDestinoId: string
  contaDestinoNome: string | null
  valor: number
  dataTransferencia: string
  observacoes: string | null
  funcionarioId: string | null
  funcionarioNome: string | null
  createdAt: string
}

export interface CriarTransferenciaInput {
  contaOrigemId: string
  contaDestinoId: string
  valor: number
  dataTransferencia?: string
  observacoes?: string
}
