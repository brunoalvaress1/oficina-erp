// Captura best-effort do IP público do navegador para auditoria (estoque_movimentacoes.ip,
// nota_fiscal_historico.ip). Client-side não tem acesso ao IP real de rede — isso é o IP
// público visto por um serviço externo, pode divergir em redes com proxy/NAT. Se a chamada
// falhar (rede lenta, bloqueio de CSP, etc.) retorna null e a auditoria segue sem essa info.
export async function capturarIpPublico(): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2000)
    const response = await fetch('https://api.ipify.org?format=json', { signal: controller.signal })
    clearTimeout(timeout)
    if (!response.ok) return null
    const dados = await response.json()
    return typeof dados.ip === 'string' ? dados.ip : null
  } catch {
    return null
  }
}
