export type TipoContaBancaria = 'corrente' | 'poupanca' | 'caixa_fisico' | 'conta_digital' | 'outro'

export const ROTULO_TIPO_CONTA_BANCARIA: Record<TipoContaBancaria, string> = {
  corrente: 'Conta Corrente',
  poupanca: 'Poupança',
  caixa_fisico: 'Caixa Físico',
  conta_digital: 'Conta Digital',
  outro: 'Outro',
}

export interface ContaBancaria {
  id: string
  oficinaId: string
  nome: string
  banco: string | null
  agencia: string | null
  conta: string | null
  pix: string | null
  tipo: TipoContaBancaria | null
  saldoInicial: number
  saldoMinimoAlerta: number | null
  ativo: boolean
  createdAt: string
}
