// Cliente mínimo pra Evolution API (open-source, conecta via WhatsApp Web no
// número escaneado) — usamos essa em vez da API oficial da Meta porque exige
// migrar/perder o número do celular. Não tem restrição de template como a
// API oficial: manda texto livre.
//
// URL e chave ficam só em secret (EVOLUTION_API_URL / EVOLUTION_API_KEY),
// nunca na tabela `integracoes` nem no client.
function baseUrl(): string {
  const url = Deno.env.get('EVOLUTION_API_URL')
  if (!url) throw new Error('EVOLUTION_API_URL não configurado nos secrets da Edge Function')
  return url.replace(/\/$/, '')
}

function apiKey(): string {
  const key = Deno.env.get('EVOLUTION_API_KEY')
  if (!key) throw new Error('EVOLUTION_API_KEY não configurado nos secrets da Edge Function')
  return key
}

interface RespostaEvolution {
  status: number
  data: Record<string, any>
}

export async function enviarTextoWhatsapp(instanceName: string, telefone: string, texto: string): Promise<RespostaEvolution> {
  const resp = await fetch(`${baseUrl()}/message/sendText/${encodeURIComponent(instanceName)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: apiKey() },
    body: JSON.stringify({ number: telefone, text: texto }),
  })
  const data = await resp.json().catch(() => ({}))
  return { status: resp.status, data }
}

// A Evolution API espera o telefone em formato internacional só com dígitos
// (código do país + DDD + número). Assume Brasil (55) quando não vem com DDI.
export function normalizarTelefoneWhatsapp(telefone: string): string {
  const digitos = telefone.replace(/\D/g, '')
  return digitos.startsWith('55') ? digitos : `55${digitos}`
}

// Estado da sessão do WhatsApp Web pareado com a instância — 'open' (conectado),
// 'close' (desconectado, precisa de novo QR code) ou 'connecting'.
export async function consultarStatusInstancia(instanceName: string): Promise<RespostaEvolution> {
  const resp = await fetch(`${baseUrl()}/instance/connectionState/${encodeURIComponent(instanceName)}`, {
    method: 'GET',
    headers: { apikey: apiKey() },
  })
  const data = await resp.json().catch(() => ({}))
  return { status: resp.status, data }
}

// Gera um novo QR code pra parear o número — a resposta traz "base64" (data
// URI da imagem do QR) quando a instância está desconectada.
export async function gerarQrCodeInstancia(instanceName: string): Promise<RespostaEvolution> {
  const resp = await fetch(`${baseUrl()}/instance/connect/${encodeURIComponent(instanceName)}`, {
    method: 'GET',
    headers: { apikey: apiKey() },
  })
  const data = await resp.json().catch(() => ({}))
  return { status: resp.status, data }
}

// Desconecta o número atual da instância (sem apagar a instância em si) —
// usado quando o usuário quer trocar de número: depois disso, gerar um novo
// QR code deixa parear outro celular na mesma instância.
//
// A documentação da Evolution API diverge entre versões sobre se esse
// endpoint é DELETE ou POST — tenta DELETE primeiro (padrão mais comum nas
// versões v2 recentes) e cai pra POST se vier 404/405.
export async function desconectarInstancia(instanceName: string): Promise<RespostaEvolution> {
  const url = `${baseUrl()}/instance/logout/${encodeURIComponent(instanceName)}`
  const headers = { apikey: apiKey() }

  const respDelete = await fetch(url, { method: 'DELETE', headers })
  if (respDelete.status !== 404 && respDelete.status !== 405) {
    const data = await respDelete.json().catch(() => ({}))
    return { status: respDelete.status, data }
  }

  const respPost = await fetch(url, { method: 'POST', headers })
  const data = await respPost.json().catch(() => ({}))
  return { status: respPost.status, data }
}
