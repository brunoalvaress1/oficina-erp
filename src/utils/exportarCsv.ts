export function exportarCsv(nomeArquivo: string, cabecalhos: string[], linhas: (string | number)[][]) {
  function escaparCampo(valor: string | number): string {
    const texto = String(valor ?? '')
    if (/[",\n;]/.test(texto)) {
      return `"${texto.replace(/"/g, '""')}"`
    }
    return texto
  }

  const conteudo = [cabecalhos, ...linhas].map((linha) => linha.map(escaparCampo).join(',')).join('\r\n')
  // BOM no início para o Excel reconhecer UTF-8 e não corromper acentos.
  const blob = new Blob(['﻿' + conteudo], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
