// Quantos dias faltam pro vencimento da mensalidade do sistema (negativo =
// já venceu há X dias, null = sem vencimento cadastrado ainda). Usado tanto
// no painel do super admin quanto na tela de pagamento que a própria oficina
// vê, pra manter a mesma conta nos dois lugares.
export function diasParaVencimento(vencimento: string | null): number | null {
  if (!vencimento) return null
  const hoje = new Date(new Date().toDateString())
  const dataVencimento = new Date(`${vencimento}T00:00:00`)
  return Math.round((dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
}

export const DIAS_LIMITE_VENCENDO = 5
