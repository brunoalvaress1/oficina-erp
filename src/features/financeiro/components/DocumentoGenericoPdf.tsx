import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'
import type { ColunaExport } from '../services/exportService'

const estilos = StyleSheet.create({
  pagina: { padding: 28, fontSize: 9, fontFamily: 'Helvetica' },
  titulo: { fontSize: 15, fontWeight: 700, marginBottom: 10 },
  tabelaHeader: { flexDirection: 'row', borderBottom: '1 solid #333', paddingBottom: 4, marginBottom: 4 },
  tabelaLinha: { flexDirection: 'row', paddingVertical: 3, borderBottom: '0.5 solid #eee' },
  celula: { flex: 1, paddingRight: 4 },
})

interface DocumentoGenericoPdfProps<T> {
  titulo: string
  colunas: ColunaExport<T>[]
  linhas: T[]
}

function DocumentoGenericoPdf<T>({ titulo, colunas, linhas }: DocumentoGenericoPdfProps<T>) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={estilos.pagina}>
        <Text style={estilos.titulo}>{titulo}</Text>
        <View style={estilos.tabelaHeader}>
          {colunas.map((coluna) => (
            <Text key={coluna.chave} style={estilos.celula}>
              {coluna.titulo}
            </Text>
          ))}
        </View>
        {linhas.map((linha, indice) => (
          <View key={indice} style={estilos.tabelaLinha}>
            {colunas.map((coluna) => (
              <Text key={coluna.chave} style={estilos.celula}>
                {String(coluna.valor(linha))}
              </Text>
            ))}
          </View>
        ))}
      </Page>
    </Document>
  )
}

export async function gerarEBaixarPdfGenerico<T>(titulo: string, colunas: ColunaExport<T>[], linhas: T[], nomeArquivo: string): Promise<void> {
  const blob = await pdf(<DocumentoGenericoPdf titulo={titulo} colunas={colunas} linhas={linhas} />).toBlob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
