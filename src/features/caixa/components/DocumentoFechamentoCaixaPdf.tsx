import { Document, Page, Text, View, Image, StyleSheet, pdf } from '@react-pdf/renderer'
import type { ResumoSessaoCaixa } from '../types/caixaSessao'
import { formatCpfCnpj } from '@/utils/format'

export interface CabecalhoOficinaPdf {
  cnpj?: string | null
  enderecoLinhas?: string[]
  telefone?: string | null
  email?: string | null
  logoUrl?: string | null
  rodape?: string | null
}

function linhasInfoOficina(cabecalho: CabecalhoOficinaPdf | undefined): string[] {
  if (!cabecalho) return []
  const linhas: string[] = []
  if (cabecalho.cnpj) linhas.push(`CNPJ: ${formatCpfCnpj(cabecalho.cnpj)}`)
  linhas.push(...(cabecalho.enderecoLinhas ?? []))
  if (cabecalho.telefone) linhas.push(`Telefone: ${cabecalho.telefone}`)
  if (cabecalho.email) linhas.push(cabecalho.email)
  return linhas
}

const estilos = StyleSheet.create({
  pagina: { padding: 24, fontSize: 10, fontFamily: 'Helvetica' },
  moldura: { border: '1.5 solid #333', borderRadius: 4, padding: 22, flexGrow: 1 },
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
  cabecalhoOficina: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  logoOficina: { height: 130, maxWidth: 260, objectFit: 'contain' },
  infoOficina: { flexDirection: 'column', alignItems: 'flex-end', gap: 5, maxWidth: 240 },
  infoOficinaLinha: { fontSize: 11, color: '#444', textAlign: 'right' },
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
  cabecalho?: CabecalhoOficinaPdf
  // Lucro só entra no PDF pra quem tem permissão de ver lucro — o resumo já
  // traz o valor calculado independente disso, então quem chama decide se
  // passa true aqui (ver FecharCaixaModal).
  mostrarLucro?: boolean
}

export function DocumentoFechamentoCaixaPdf({ resumo, cabecalho, mostrarLucro }: DocumentoFechamentoCaixaPdfProps) {
  const { sessao } = resumo
  const linhasOficina = linhasInfoOficina(cabecalho)

  return (
    <Document>
      <Page size="A4" style={estilos.pagina}>
        <View style={estilos.moldura}>
        {(cabecalho?.logoUrl || linhasOficina.length > 0) && (
          <View style={estilos.cabecalhoOficina}>
            {cabecalho?.logoUrl ? <Image src={cabecalho.logoUrl} style={estilos.logoOficina} /> : <View />}
            <View style={estilos.infoOficina}>
              {linhasOficina.map((linha, indice) => (
                <Text key={indice} style={estilos.infoOficinaLinha}>
                  {linha}
                </Text>
              ))}
            </View>
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
          <Text style={estilos.totalGeral}>Total Geral Recebido: {formatarMoeda(resumo.totalGeral)}</Text>
          {mostrarLucro && <Text style={estilos.totalGeral}>Lucro do Período: {formatarMoeda(resumo.lucroTotal)}</Text>}
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

        </View>

        {cabecalho?.rodape && <Text style={estilos.rodape}>{cabecalho.rodape}</Text>}
      </Page>
    </Document>
  )
}

export async function gerarEBaixarPdfFechamento(
  resumo: ResumoSessaoCaixa,
  cabecalho?: CabecalhoOficinaPdf,
  mostrarLucro?: boolean,
): Promise<void> {
  const blob = await pdf(<DocumentoFechamentoCaixaPdf resumo={resumo} cabecalho={cabecalho} mostrarLucro={mostrarLucro} />).toBlob()
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
  cabecalho?: CabecalhoOficinaPdf,
  mostrarLucro?: boolean,
): Promise<void> {
  const blob = await pdf(<DocumentoFechamentoCaixaPdf resumo={resumo} cabecalho={cabecalho} mostrarLucro={mostrarLucro} />).toBlob()
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank', 'noopener,noreferrer')
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
