export type AmbienteNfe = 'homologacao' | 'producao'

const BASE_URL: Record<AmbienteNfe, string> = {
  homologacao: 'https://homologacao.focusnfe.com.br',
  producao: 'https://api.focusnfe.com.br',
}

function authHeader(): string {
  const token = Deno.env.get('FOCUS_NFE_TOKEN')
  if (!token) throw new Error('FOCUS_NFE_TOKEN não configurado nos secrets da Edge Function')
  return 'Basic ' + btoa(`${token}:`)
}

interface RespostaFocus {
  status: number
  data: Record<string, any>
}

async function chamar(ambiente: AmbienteNfe, metodo: string, caminho: string, payload?: unknown): Promise<RespostaFocus> {
  const resp = await fetch(`${BASE_URL[ambiente]}${caminho}`, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', Authorization: authHeader() },
    body: payload !== undefined ? JSON.stringify(payload) : undefined,
  })
  const data = await resp.json().catch(() => ({}))
  return { status: resp.status, data }
}

export function focusNfePost(ambiente: AmbienteNfe, caminho: string, payload: unknown) {
  return chamar(ambiente, 'POST', caminho, payload)
}

export function focusNfeGet(ambiente: AmbienteNfe, caminho: string) {
  return chamar(ambiente, 'GET', caminho)
}

export function focusNfeDelete(ambiente: AmbienteNfe, caminho: string, payload: unknown) {
  return chamar(ambiente, 'DELETE', caminho, payload)
}

// Campos "caminho_*" da Focus (caminho_danfe, caminho_xml_nota_fiscal) vêm
// como PATH RELATIVO (ex: "/arquivos/12345_1/202603/DANFEs/NFe...pdf"), não
// URL completa — só campos "url_*"/"qrcode_url" já vêm absolutos. Sem
// resolver isso, o link abre dentro do nosso próprio site em vez do servidor
// da Focus.
export function resolverCaminhoFocus(ambiente: AmbienteNfe, caminho: string | null | undefined): string | null {
  if (!caminho) return null
  if (caminho.startsWith('http://') || caminho.startsWith('https://')) return caminho
  return `${BASE_URL[ambiente]}${caminho}`
}

// Tabela tPag da Sefaz — mapeia nossas 9 formas de pagamento fixas pro código
// que a NFC-e exige. Ajustar aqui se a Sefaz revisar a tabela.
export const CODIGO_FORMA_PAGAMENTO_SEFAZ: Record<string, string> = {
  dinheiro: '01',
  cheque: '02',
  credito: '03',
  debito: '04',
  crediario: '05',
  boleto: '15',
  pix: '17',
  transferencia: '18',
  outros: '99',
}

const NOME_ESTADO_PARA_UF: Record<string, string> = {
  acre: 'AC', alagoas: 'AL', amapa: 'AP', amazonas: 'AM', bahia: 'BA', ceara: 'CE',
  'distrito federal': 'DF', 'espirito santo': 'ES', goias: 'GO', maranhao: 'MA',
  'mato grosso': 'MT', 'mato grosso do sul': 'MS', 'minas gerais': 'MG', para: 'PA',
  paraiba: 'PB', parana: 'PR', pernambuco: 'PE', piaui: 'PI', 'rio de janeiro': 'RJ',
  'rio grande do norte': 'RN', 'rio grande do sul': 'RS', rondonia: 'RO', roraima: 'RR',
  'santa catarina': 'SC', 'sao paulo': 'SP', sergipe: 'SE', tocantins: 'TO',
}

const MAPA_ACENTOS: Record<string, string> = {
  á: 'a', à: 'a', â: 'a', ã: 'a', ä: 'a',
  é: 'e', è: 'e', ê: 'e', ë: 'e',
  í: 'i', ì: 'i', î: 'i', ï: 'i',
  ó: 'o', ò: 'o', ô: 'o', õ: 'o', ö: 'o',
  ú: 'u', ù: 'u', û: 'u', ü: 'u',
  ç: 'c',
}

function removerAcentos(texto: string): string {
  return texto.replace(/[áàâãäéèêëíìîïóòôõöúùûüç]/g, (c) => MAPA_ACENTOS[c] ?? c)
}

// Campos de estado no sistema às vezes são digitados como nome completo
// ("São Paulo") em vez da sigla ("SP") — normaliza pra sigla antes de comparar
// ou enviar pra Focus, que exige sempre a sigla de 2 letras.
export function normalizarUf(estado: string | null | undefined): string | null {
  if (!estado) return null
  const limpo = estado.trim()
  if (limpo.length === 2) return limpo.toUpperCase()
  const semAcento = removerAcentos(limpo.toLowerCase())
  return NOME_ESTADO_PARA_UF[semAcento] ?? limpo.toUpperCase()
}

// `new Date().toISOString()` devolve UTC ("...Z") — o exemplo oficial da
// Focus pra data_emissao usa horário local de Brasília com offset explícito
// ("2025-01-01T07:30:00-0300"). Enviar em UTC faz o horário aparecer 3h à
// frente do horário real de Brasília, o que gerou rejeição da NFS-e ("data de
// emissão não pode ser posterior ao processamento"). Brasil não usa mais
// horário de verão (abolido em 2019), então o offset de São Paulo é sempre
// fixo em -03:00.
export function dataEmissaoBrasilia(): string {
  const agoraUtc = new Date()
  const horaLocal = new Date(agoraUtc.getTime() - 3 * 60 * 60 * 1000)
  return horaLocal.toISOString().replace('Z', '-03:00')
}
