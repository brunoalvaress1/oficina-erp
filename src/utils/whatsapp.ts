// Abre o WhatsApp Web com uma mensagem pronta, sem depender de nenhuma API paga —
// o usuário revisa e clica em enviar manualmente.
export function abrirWhatsApp(telefone: string, mensagem: string): void {
  const digitos = telefone.replace(/\D/g, '')
  const comDdi = digitos.startsWith('55') ? digitos : `55${digitos}`
  const url = `https://wa.me/${comDdi}?text=${encodeURIComponent(mensagem)}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

export function montarMensagemOrdemPronta(
  nomeCliente: string,
  numeroOrdem: number,
  valorTotal: number,
  template?: string | null,
  nomeEmpresa?: string | null,
): string {
  const valorFormatado = valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  if (template && template.trim()) {
    return template
      .replaceAll('{cliente}', nomeCliente)
      .replaceAll('{os}', String(numeroOrdem))
      .replaceAll('{valor}', valorFormatado)
      .replaceAll('{empresa}', nomeEmpresa || 'Oficina')
  }

  return [
    `Olá ${nomeCliente}!`,
    '',
    `Sua Ordem de Serviço nº ${numeroOrdem} está pronta.`,
    '',
    `Valor: ${valorFormatado}`,
    '',
    'Aguardamos você.',
    `Equipe ${nomeEmpresa || 'Oficina'}.`,
  ].join('\n')
}
