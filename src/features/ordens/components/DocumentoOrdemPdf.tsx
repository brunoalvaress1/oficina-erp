import { Document, Page, Text, View, Image, StyleSheet, pdf } from '@react-pdf/renderer'
import type { OrdemServico, OrdemServicoItem } from '../types/ordemServico'
import { ROTULO_STATUS_ORDEM } from '../types/ordemServico'
import { formatDate } from '@/utils/format'
import { ROTULO_FORMA_PAGAMENTO, type FormaPagamento } from '@/features/caixa/types/caixa'
import { buscarFormasPagamentoDaOrdem } from '@/features/caixa/services/caixaService'

export type ModoDocumentoOrdem = 'os' | 'defeitos' | 'aprovacao' | 'orcamento'

export interface CabecalhoOficinaPdf {
  endereco?: string | null
  telefone?: string | null
  email?: string | null
  logoUrl?: string | null
  rodape?: string | null
}

const TITULO_POR_MODO: Record<ModoDocumentoOrdem, string> = {
  os: 'Ordem de Serviço',
  defeitos: 'Defeitos Encontrados',
  aprovacao: 'Aprovação de Serviços/Peças',
  orcamento: 'Ordem de Serviço',
}

const estilos = StyleSheet.create({
  pagina: { padding: 24, fontSize: 11, fontFamily: 'Helvetica' },
  moldura: { border: '1.5 solid #333', borderRadius: 4, padding: 22, flexGrow: 1 },
  titulo: { fontSize: 18, fontWeight: 700, marginBottom: 4 },
  subtitulo: { fontSize: 11, color: '#555', marginBottom: 16 },
  secao: { marginBottom: 14 },
  secaoTitulo: { fontSize: 12, fontWeight: 700, marginBottom: 6, borderBottom: '1 solid #ccc', paddingBottom: 2 },
  linha: { flexDirection: 'row', marginBottom: 4 },
  rotulo: { width: 130, color: '#555' },
  valor: { flex: 1 },
  tabelaHeader: { flexDirection: 'row', borderBottom: '1 solid #333', paddingBottom: 4, marginBottom: 4 },
  tabelaLinha: { flexDirection: 'row', paddingVertical: 4, borderBottom: '0.5 solid #eee' },
  colDescricao: { flex: 3 },
  colQtd: { flex: 1, textAlign: 'right' },
  colValor: { flex: 1, textAlign: 'right' },
  colTotal: { flex: 1, textAlign: 'right' },
  totais: { marginTop: 12, alignItems: 'flex-end' },
  totalGeral: { fontSize: 13, fontWeight: 700, marginTop: 4 },
  assinatura: { marginTop: 60, borderTop: '1 solid #333', width: 260, textAlign: 'center', paddingTop: 4 },
  cabecalhoOficina: { flexDirection: 'row', alignItems: 'flex-start', gap: 18, marginBottom: 20 },
  logoOficina: { width: 210, height: 210, objectFit: 'contain' },
  infoOficina: { flexDirection: 'column', gap: 6, paddingTop: 4 },
  infoOficinaLinha: { fontSize: 12, color: '#444' },
  rodape: { marginTop: 24, paddingTop: 6, borderTop: '0.5 solid #ccc', fontSize: 9, color: '#777', textAlign: 'center' },
})

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

interface DocumentoOrdemPdfProps {
  ordem: OrdemServico
  itens: OrdemServicoItem[]
  modo: ModoDocumentoOrdem
  cabecalho?: CabecalhoOficinaPdf
  formasPagamento?: Array<{ formaPagamento: FormaPagamento; valor: number }>
}

export function DocumentoOrdemPdf({ ordem, itens, modo, cabecalho, formasPagamento }: DocumentoOrdemPdfProps) {
  const itensRelevantes = modo === 'aprovacao' ? itens.filter((item) => item.statusAprovacao === 'aguardando') : itens

  return (
    <Document>
      <Page size="A4" style={estilos.pagina}>
        <View style={estilos.moldura}>
          {(cabecalho?.logoUrl || cabecalho?.endereco || cabecalho?.telefone || cabecalho?.email) && (
            <View style={estilos.cabecalhoOficina}>
              {cabecalho.logoUrl && <Image src={cabecalho.logoUrl} style={estilos.logoOficina} />}
              <View style={estilos.infoOficina}>
                {cabecalho.endereco && <Text style={estilos.infoOficinaLinha}>{cabecalho.endereco}</Text>}
                {cabecalho.telefone && <Text style={estilos.infoOficinaLinha}>Telefone: {cabecalho.telefone}</Text>}
                {cabecalho.email && <Text style={estilos.infoOficinaLinha}>{cabecalho.email}</Text>}
              </View>
            </View>
          )}
          <Text style={estilos.titulo}>{TITULO_POR_MODO[modo]}</Text>
          <Text style={estilos.subtitulo}>
            OS nº {ordem.numero} {ordem.numeroPrisma ? `· Prisma ${ordem.numeroPrisma}` : ''} · {formatDate(ordem.dataAbertura)}
          </Text>

          <View style={estilos.secao}>
            <Text style={estilos.secaoTitulo}>Cliente e Veículo</Text>
            <View style={estilos.linha}>
              <Text style={estilos.rotulo}>Cliente</Text>
              <Text style={estilos.valor}>{ordem.clienteNome ?? '-'}</Text>
            </View>
            <View style={estilos.linha}>
              <Text style={estilos.rotulo}>Veículo</Text>
              <Text style={estilos.valor}>
                {ordem.veiculoId ? `${ordem.veiculoModelo ?? '-'} · Placa ${ordem.veiculoPlaca ?? '-'}` : 'Nenhum veículo cadastrado'}
              </Text>
            </View>
            {ordem.veiculoId && (
              <View style={estilos.linha}>
                <Text style={estilos.rotulo}>Quilometragem</Text>
                <Text style={estilos.valor}>{ordem.kmAtual} km</Text>
              </View>
            )}
            <View style={estilos.linha}>
              <Text style={estilos.rotulo}>Status</Text>
              <Text style={estilos.valor}>{ROTULO_STATUS_ORDEM[ordem.status]}</Text>
            </View>
          </View>

          {modo === 'defeitos' && (
            <View style={estilos.secao}>
              <Text style={estilos.secaoTitulo}>Defeitos Relatados</Text>
              <Text>{ordem.defeitosRelatados?.trim() || 'Nenhum defeito relatado.'}</Text>
            </View>
          )}

          {modo !== 'defeitos' && (
            <View style={estilos.secao}>
              <Text style={estilos.secaoTitulo}>
                {modo === 'aprovacao' ? 'Itens Aguardando Aprovação' : 'Produtos e Serviços'}
              </Text>
              <View style={estilos.tabelaHeader}>
                <Text style={estilos.colDescricao}>Descrição</Text>
                <Text style={estilos.colQtd}>Qtd.</Text>
                <Text style={estilos.colValor}>Valor Unit.</Text>
                <Text style={estilos.colTotal}>Total</Text>
              </View>
              {itensRelevantes.length === 0 && <Text>Nenhum item.</Text>}
              {itensRelevantes.map((item) => (
                <View key={item.id} style={estilos.tabelaLinha}>
                  <Text style={estilos.colDescricao}>{item.descricao}</Text>
                  <Text style={estilos.colQtd}>{item.quantidade}</Text>
                  <Text style={estilos.colValor}>{formatarMoeda(item.valorUnitario)}</Text>
                  <Text style={estilos.colTotal}>{formatarMoeda(item.valorTotal)}</Text>
                </View>
              ))}

              {modo !== 'aprovacao' && (
                <View style={estilos.totais}>
                  <Text style={estilos.totalGeral}>Total: {formatarMoeda(ordem.valorTotal)}</Text>
                </View>
              )}
            </View>
          )}

          {modo === 'os' && formasPagamento && formasPagamento.length > 0 && (
            <View style={estilos.secao}>
              <Text style={estilos.secaoTitulo}>Forma de Pagamento</Text>
              {formasPagamento.map((forma, indice) => (
                <View key={indice} style={estilos.linha}>
                  <Text style={estilos.rotulo}>{ROTULO_FORMA_PAGAMENTO[forma.formaPagamento]}</Text>
                  <Text style={estilos.valor}>{formatarMoeda(forma.valor)}</Text>
                </View>
              ))}
            </View>
          )}

          {modo === 'aprovacao' && (
            <View style={estilos.assinatura}>
              <Text>Assinatura do Cliente</Text>
            </View>
          )}
        </View>

        {cabecalho?.rodape && <Text style={estilos.rodape}>{cabecalho.rodape}</Text>}
      </Page>
    </Document>
  )
}

// Abre o PDF direto numa aba nova (visualizador nativo do navegador) em vez de
// baixar o arquivo — o usuário imprime por lá (Ctrl+P / ícone de impressão do
// próprio visualizador), sem precisar salvar nada no computador.
export async function gerarEAbrirPdfOrdem(
  ordem: OrdemServico,
  itens: OrdemServicoItem[],
  modo: ModoDocumentoOrdem,
  cabecalho?: CabecalhoOficinaPdf,
) {
  // Não trava na condição "ordem.status === 'paga'" do objeto recebido — em
  // telas que reaproveitam uma OS já carregada antes do pagamento, esse
  // status pode estar desatualizado no cache mesmo com o pagamento já
  // registrado no banco. A busca abaixo vai direto no caixa_lancamento e
  // simplesmente retorna vazio se realmente não tiver pagamento — mais
  // confiável do que confiar no status local.
  const formasPagamento =
    modo === 'os'
      ? await buscarFormasPagamentoDaOrdem(ordem.id).catch((error) => {
          console.error('Não foi possível carregar a forma de pagamento para o PDF da OS:', error)
          return []
        })
      : []
  const blob = await pdf(
    <DocumentoOrdemPdf ordem={ordem} itens={itens} modo={modo} cabecalho={cabecalho} formasPagamento={formasPagamento} />,
  ).toBlob()
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank', 'noopener,noreferrer')
  // Só libera a URL depois de um tempo — se revogar na hora, a aba pode abrir em branco.
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
