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
  const resp = await fetch(`${baseUrl()}/message/sendText/${instanceName}`, {
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
