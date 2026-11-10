// Edge functions lançam "FUNCIONALIDADE_DESATIVADA: <mensagem>" quando o
// super admin desativou aquela função pra todas as oficinas (Admin →
// Oficinas). Extrai só a mensagem que ele escolheu, sem o prefixo técnico.
export function extrairMensagemFuncionalidadeDesativada(mensagem: string): string | null {
  const prefixo = 'FUNCIONALIDADE_DESATIVADA:'
  if (!mensagem.includes(prefixo)) return null
  return mensagem.slice(mensagem.indexOf(prefixo) + prefixo.length).trim()
}
