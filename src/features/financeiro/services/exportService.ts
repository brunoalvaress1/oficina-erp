export interface ColunaExport<T> {
  chave: string
  titulo: string
  valor: (linha: T) => string | number
}

function nomeArquivo(base: string, extensao: string): string {
  const agora = new Date()
  const data = `${agora.getFullYear()}${String(agora.getMonth() + 1).padStart(2, '0')}${String(agora.getDate()).padStart(2, '0')}`
  return `${base}-${data}.${extensao}`
}

function baixarBlob(blob: Blob, nome: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nome
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportarCsv<T>(linhas: T[], colunas: ColunaExport<T>[], nomeBase: string): void {
  const cabecalho = colunas.map((c) => `"${c.titulo.replace(/"/g, '""')}"`).join(';')
  const corpo = linhas
    .map((linha) => colunas.map((c) => `"${String(c.valor(linha)).replace(/"/g, '""')}"`).join(';'))
    .join('\n')
  const conteudo = `${cabecalho}\n${corpo}`
  const blob = new Blob(['﻿' + conteudo], { type: 'text/csv;charset=utf-8;' })
  baixarBlob(blob, nomeArquivo(nomeBase, 'csv'))
}

export async function exportarExcel<T>(linhas: T[], colunas: ColunaExport<T>[], nomeBase: string): Promise<void> {
  const XLSX = await import('xlsx')
  const dados = linhas.map((linha) => {
    const objeto: Record<string, string | number> = {}
    for (const coluna of colunas) objeto[coluna.titulo] = coluna.valor(linha)
    return objeto
  })
  const planilha = XLSX.utils.json_to_sheet(dados)
  const livro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(livro, planilha, 'Dados')
  XLSX.writeFile(livro, nomeArquivo(nomeBase, 'xlsx'))
}

export function imprimirTabela<T>(linhas: T[], colunas: ColunaExport<T>[], titulo: string): void {
  const janela = window.open('', '_blank')
  if (!janela) return

  const linhasHtml = linhas
    .map((linha) => `<tr>${colunas.map((c) => `<td>${c.valor(linha)}</td>`).join('')}</tr>`)
    .join('')

  janela.document.write(`
    <html>
      <head>
        <title>${titulo}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; }
          h1 { font-size: 18px; margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
          th { background: #f3f3f3; }
        </style>
      </head>
      <body>
        <h1>${titulo}</h1>
        <table>
          <thead><tr>${colunas.map((c) => `<th>${c.titulo}</th>`).join('')}</tr></thead>
          <tbody>${linhasHtml}</tbody>
        </table>
      </body>
    </html>
  `)
  janela.document.close()
  janela.focus()
  janela.print()
}
