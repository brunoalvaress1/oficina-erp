import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'
import { formatDate } from '@/utils/format'
import type { LucroServico } from '../types/relatorioLucro'

const estilos = StyleSheet.create({
  pagina: { padding: 32, fontSize: 10, fontFamily: 'Helvetica' },
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
  colNumero: { flex: 1, textAlign: 'right' },
})

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

interface ResumoLucroServicos {
  quantidade: number
  valorVendido: number
  lucro: number
}

interface DocumentoLucroServicosPdfProps {
  linhas: LucroServico[]
  resumo: ResumoLucroServicos
  dataInicio: string
  dataFim: string
}

function DocumentoLucroServicosPdf({ linhas, resumo, dataInicio, dataFim }: DocumentoLucroServicosPdfProps) {
  return (
    <Document>
      <Page size="A4" style={estilos.pagina}>
        <Text style={estilos.titulo}>Relatório de Lucro em Serviços</Text>
        <Text style={estilos.subtitulo}>
          Período: {formatDate(dataInicio)} até {formatDate(dataFim)}
        </Text>

        <View style={estilos.secao}>
          <Text style={estilos.secaoTitulo}>Resumo</Text>
          <View style={estilos.linhaResumo}>
            <Text style={estilos.rotulo}>Serviços Realizados</Text>
            <Text style={estilos.valor}>{resumo.quantidade}</Text>
          </View>
          <View style={estilos.linhaResumo}>
            <Text style={estilos.rotulo}>Valor Vendido</Text>
            <Text style={estilos.valor}>{formatarMoeda(resumo.valorVendido)}</Text>
          </View>
          <View style={estilos.linhaResumo}>
            <Text style={estilos.rotulo}>Lucro (100%)</Text>
            <Text style={estilos.valor}>{formatarMoeda(resumo.lucro)}</Text>
          </View>
        </View>

        <View style={estilos.secao}>
          <Text style={estilos.secaoTitulo}>Detalhamento por serviço ({linhas.length})</Text>
          <View style={estilos.tabelaHeader}>
            <Text style={estilos.colDescricao}>Serviço</Text>
            <Text style={estilos.colNumero}>Qtd.</Text>
            <Text style={estilos.colNumero}>Vendido</Text>
            <Text style={estilos.colNumero}>Lucro</Text>
          </View>
          {linhas.map((servico, indice) => (
            <View key={indice} style={estilos.tabelaLinha}>
              <Text style={estilos.colDescricao}>{servico.descricao}</Text>
              <Text style={estilos.colNumero}>{servico.quantidade}</Text>
              <Text style={estilos.colNumero}>{formatarMoeda(servico.valorVendido)}</Text>
              <Text style={estilos.colNumero}>{formatarMoeda(servico.lucro)}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  )
}

export async function gerarEBaixarPdfLucroServicos(
  linhas: LucroServico[],
  resumo: ResumoLucroServicos,
  dataInicio: string,
  dataFim: string,
): Promise<void> {
  const blob = await pdf(<DocumentoLucroServicosPdf linhas={linhas} resumo={resumo} dataInicio={dataInicio} dataFim={dataFim} />).toBlob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `lucro-servicos-${dataInicio}-a-${dataFim}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
