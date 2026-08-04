import { Document, Page, Text, View, Image, StyleSheet, pdf } from '@react-pdf/renderer'
import type { ResumoSessaoCaixa } from '../types/caixaSessao'

export interface CabecalhoOficinaPdf {
  nome?: string | null
  logoUrl?: string | null
  rodape?: string | null
}

const estilos = StyleSheet.create({
  pagina: { padding: 32, fontSize: 10, fontFamily: 'Helvetica' },
  titulo: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  subtitulo: { fontSize: 10, color: '#555', marginBottom: 16 },
  secao: { marginBottom: 14 },
  secaoTitulo: { fontSize: 11, fontWeight: 700, marginBottom: 6, borderBottom: '1 solid #ccc', paddingBottom: 2 },
  linha: { flexDirection: 'row', marginBottom: 3 },
  rotulo: { width: 160, color: '#555' },
  valor: { flex: 1 },
  tabelaHeader: { flexDirection: 'row', borderBottom: '1 solid #333', paddingBottom: 4, marginBottom: 4 },
  tabelaLinha: { flexDirection: 'row', paddingVertical: 3, borderBottom: '0.5 solid #eee' },
  colDescricao: { flex: 2 },
  colValor: { flex: 1, textAlign: 'right' },
  colData: { flex: 1, textAlign: 'right' },
  totalGeral: { fontSize: 12, fontWeight: 700, marginTop: 8 },
  cabecalhoOficina: { flexDirection: 'row', alignItems: 'center', gap: 18, marginBottom: 18 },
  logoOficina: { width: 170, height: 170, objectFit: 'contain' },
  nomeOficina: { fontSize: 32, fontWeight: 700 },
  rodape: { marginTop: 24, paddingTop: 6, borderTop: '0.5 solid #ccc', fontSize: 8, color: '#777', textAlign: 'center' },
})

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarDataHora(data: string): string {
  return new Date(data).toLocaleString('pt-BR')
}

interface DocumentoFechamentoCaixaPdfProps {
  resumo: ResumoSessaoCaixa
  valorContado?: number | null
  cabecalho?: CabecalhoOficinaPdf
}

export function DocumentoFechamentoCaixaPdf({ resumo, valorContado, cabecalho }: DocumentoFechamentoCaixaPdfProps) {
  const { sessao } = resumo
  const diferenca = valorContado != null ? valorContado - resumo.valorEsperadoDinheiro : null

  return (
    <Document>
      <Page size="A4" style={estilos.pagina}>
        {(cabecalho?.nome || cabecalho?.logoUrl) && (
          <View style={estilos.cabecalhoOficina}>
            {cabecalho.logoUrl && <Image src={cabecalho.logoUrl} style={estilos.logoOficina} />}
            {cabecalho.nome && <Text style={estilos.nomeOficina}>{cabecalho.nome}</Text>}
          </View>
        )}
        <Text style={estilos.titulo}>Fechamento de Caixa</Text>
        <Text style={estilos.subtitulo}>
          {formatarDataHora(sessao.dataAbertura)} até {sessao.dataFechamento ? formatarDataHora(sessao.dataFechamento) : 'agora'}
        </Text>

        <View style={estilos.secao}>
          <Text style={estilos.secaoTitulo}>Sessão</Text>
          <View style={estilos.linha}>
            <Text style={estilos.rotulo}>Aberto por</Text>
            <Text style={estilos.valor}>{sessao.funcionarioAberturaNome ?? '-'}</Text>
          </View>
          <View style={estilos.linha}>
            <Text style={estilos.rotulo}>Fechado por</Text>
            <Text style={estilos.valor}>{sessao.funcionarioFechamentoNome ?? '-'}</Text>
          </View>
          <View style={estilos.linha}>
            <Text style={estilos.rotulo}>Valor de Abertura</Text>
            <Text style={estilos.valor}>{formatarMoeda(sessao.valorAbertura)}</Text>
          </View>
        </View>

        <View style={estilos.secao}>
          <Text style={estilos.secaoTitulo}>Totais por Forma de Pagamento</Text>
          <View style={estilos.linha}>
            <Text style={estilos.rotulo}>Dinheiro</Text>
            <Text style={estilos.valor}>{formatarMoeda(resumo.totalDinheiro)}</Text>
          </View>
          <View style={estilos.linha}>
            <Text style={estilos.rotulo}>PIX</Text>
            <Text style={estilos.valor}>{formatarMoeda(resumo.totalPix)}</Text>
          </View>
          <View style={estilos.linha}>
            <Text style={estilos.rotulo}>Débito</Text>
            <Text style={estilos.valor}>{formatarMoeda(resumo.totalDebito)}</Text>
          </View>
          <View style={estilos.linha}>
            <Text style={estilos.rotulo}>Crédito</Text>
            <Text style={estilos.valor}>{formatarMoeda(resumo.totalCredito)}</Text>
          </View>
          <View style={estilos.linha}>
            <Text style={estilos.rotulo}>Transferência</Text>
            <Text style={estilos.valor}>{formatarMoeda(resumo.totalTransferencia)}</Text>
          </View>
          <View style={estilos.linha}>
            <Text style={estilos.rotulo}>Cheque</Text>
            <Text style={estilos.valor}>{formatarMoeda(resumo.totalCheque)}</Text>
          </View>
          <View style={estilos.linha}>
            <Text style={estilos.rotulo}>Crediário</Text>
            <Text style={estilos.valor}>{formatarMoeda(resumo.totalCrediario)}</Text>
          </View>
          <View style={estilos.linha}>
            <Text style={estilos.rotulo}>Boleto</Text>
            <Text style={estilos.valor}>{formatarMoeda(resumo.totalBoleto)}</Text>
          </View>
          <View style={estilos.linha}>
            <Text style={estilos.rotulo}>Outros</Text>
            <Text style={estilos.valor}>{formatarMoeda(resumo.totalOutros)}</Text>
          </View>
          <View style={estilos.linha}>
            <Text style={estilos.rotulo}>Valor esperado em dinheiro</Text>
            <Text style={estilos.valor}>{formatarMoeda(resumo.valorEsperadoDinheiro)}</Text>
          </View>
          {valorContado != null && (
            <View style={estilos.linha}>
              <Text style={estilos.rotulo}>Valor contado em caixa</Text>
              <Text style={estilos.valor}>{formatarMoeda(valorContado)}</Text>
            </View>
          )}
          {diferenca != null && (
            <View style={estilos.linha}>
              <Text style={estilos.rotulo}>Diferença</Text>
              <Text style={estilos.valor}>{formatarMoeda(diferenca)}</Text>
            </View>
          )}
          <Text style={estilos.totalGeral}>Total Geral Recebido: {formatarMoeda(resumo.totalGeral)}</Text>
        </View>

        <View style={estilos.secao}>
          <Text style={estilos.secaoTitulo}>Recebimentos ({resumo.quantidadeRecebimentos})</Text>
          <View style={estilos.tabelaHeader}>
            <Text style={estilos.colDescricao}>OS / Cliente</Text>
            <Text style={estilos.colValor}>Valor</Text>
            <Text style={estilos.colData}>Data/Hora</Text>
          </View>
          {resumo.recebimentos.length === 0 && <Text>Nenhum recebimento nessa sessão.</Text>}
          {resumo.recebimentos.map((r, indice) => (
            <View key={indice} style={estilos.tabelaLinha}>
              <Text style={estilos.colDescricao}>
                OS {r.ordemNumero} {r.clienteNome ? `· ${r.clienteNome}` : ''}
              </Text>
              <Text style={estilos.colValor}>{formatarMoeda(r.valorTotal)}</Text>
              <Text style={estilos.colData}>{formatarDataHora(r.createdAt)}</Text>
            </View>
          ))}
        </View>

        {cabecalho?.rodape && (
          <Text style={estilos.rodape}>{cabecalho.rodape}</Text>
        )}
      </Page>
    </Document>
  )
}

export async function gerarEBaixarPdfFechamento(
  resumo: ResumoSessaoCaixa,
  valorContado?: number | null,
  cabecalho?: CabecalhoOficinaPdf,
): Promise<void> {
  const blob = await pdf(<DocumentoFechamentoCaixaPdf resumo={resumo} valorContado={valorContado} cabecalho={cabecalho} />).toBlob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `fechamento-caixa-${resumo.sessao.id.slice(0, 8)}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function gerarEAbrirPdfFechamento(
  resumo: ResumoSessaoCaixa,
  valorContado?: number | null,
  cabecalho?: CabecalhoOficinaPdf,
): Promise<void> {
  const blob = await pdf(<DocumentoFechamentoCaixaPdf resumo={resumo} valorContado={valorContado} cabecalho={cabecalho} />).toBlob()
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank', 'noopener,noreferrer')
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
