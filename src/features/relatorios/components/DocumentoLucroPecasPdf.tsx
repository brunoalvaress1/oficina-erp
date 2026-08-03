import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'
import { formatDate } from '@/utils/format'
import type { LucroPeca } from '../types/relatorioLucro'

const ROTULO_TIPO: Record<LucroPeca['tipo'], string> = {
  produto_estoque: 'Estoque próprio',
  produto_terceirizado: 'Terceirizada',
}

const estilos = StyleSheet.create({
  pagina: { padding: 28, fontSize: 9, fontFamily: 'Helvetica' },
  titulo: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  subtitulo: { fontSize: 10, color: '#555', marginBottom: 16 },
  secao: { marginBottom: 14 },
  secaoTitulo: { fontSize: 11, fontWeight: 700, marginBottom: 6, borderBottom: '1 solid #ccc', paddingBottom: 2 },
  linhaResumo: { flexDirection: 'row', marginBottom: 3 },
  rotulo: { width: 140, color: '#555' },
  valor: { flex: 1 },
  tabelaHeader: { flexDirection: 'row', borderBottom: '1 solid #333', paddingBottom: 4, marginBottom: 4 },
  tabelaLinha: { flexDirection: 'row', paddingVertical: 3, borderBottom: '0.5 solid #eee' },
  colDescricao: { flex: 3 },
  colOrigem: { flex: 1.5 },
  colNumero: { flex: 1, textAlign: 'right' },
})

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

interface ResumoLucroPecas {
  valorVendido: number
  custoTotal: number
  lucro: number
  margemMedia: number
}

interface DocumentoLucroPecasPdfProps {
  linhas: LucroPeca[]
  resumo: ResumoLucroPecas
  dataInicio: string
  dataFim: string
}

function DocumentoLucroPecasPdf({ linhas, resumo, dataInicio, dataFim }: DocumentoLucroPecasPdfProps) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={estilos.pagina}>
        <Text style={estilos.titulo}>Relatório de Lucro em Peças</Text>
        <Text style={estilos.subtitulo}>
          Período: {formatDate(dataInicio)} até {formatDate(dataFim)}
        </Text>

        <View style={estilos.secao}>
          <Text style={estilos.secaoTitulo}>Resumo</Text>
          <View style={estilos.linhaResumo}>
            <Text style={estilos.rotulo}>Valor Vendido</Text>
            <Text style={estilos.valor}>{formatarMoeda(resumo.valorVendido)}</Text>
          </View>
          <View style={estilos.linhaResumo}>
            <Text style={estilos.rotulo}>Custo Total</Text>
            <Text style={estilos.valor}>{formatarMoeda(resumo.custoTotal)}</Text>
          </View>
          <View style={estilos.linhaResumo}>
            <Text style={estilos.rotulo}>Lucro</Text>
            <Text style={estilos.valor}>{formatarMoeda(resumo.lucro)}</Text>
          </View>
          <View style={estilos.linhaResumo}>
            <Text style={estilos.rotulo}>Margem Média</Text>
            <Text style={estilos.valor}>{resumo.margemMedia.toFixed(1)}%</Text>
          </View>
        </View>

        <View style={estilos.secao}>
          <Text style={estilos.secaoTitulo}>Detalhamento por peça ({linhas.length})</Text>
          <View style={estilos.tabelaHeader}>
            <Text style={estilos.colDescricao}>Peça</Text>
            <Text style={estilos.colOrigem}>Origem</Text>
            <Text style={estilos.colNumero}>Qtd.</Text>
            <Text style={estilos.colNumero}>Vendido</Text>
            <Text style={estilos.colNumero}>Custo</Text>
            <Text style={estilos.colNumero}>Lucro</Text>
            <Text style={estilos.colNumero}>Margem</Text>
          </View>
          {linhas.map((peca, indice) => (
            <View key={indice} style={estilos.tabelaLinha}>
              <Text style={estilos.colDescricao}>{peca.descricao}</Text>
              <Text style={estilos.colOrigem}>{ROTULO_TIPO[peca.tipo]}</Text>
              <Text style={estilos.colNumero}>{peca.quantidade}</Text>
              <Text style={estilos.colNumero}>{formatarMoeda(peca.valorVendido)}</Text>
              <Text style={estilos.colNumero}>{formatarMoeda(peca.custoTotal)}</Text>
              <Text style={estilos.colNumero}>{formatarMoeda(peca.lucro)}</Text>
              <Text style={estilos.colNumero}>{peca.margemPercentual.toFixed(1)}%</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  )
}

export async function gerarEBaixarPdfLucroPecas(
  linhas: LucroPeca[],
  resumo: ResumoLucroPecas,
  dataInicio: string,
  dataFim: string,
): Promise<void> {
  const blob = await pdf(<DocumentoLucroPecasPdf linhas={linhas} resumo={resumo} dataInicio={dataInicio} dataFim={dataFim} />).toBlob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `lucro-pecas-${dataInicio}-a-${dataFim}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
