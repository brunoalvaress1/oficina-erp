// Consulta dados de um veículo pela placa via PuxaPlaca (api.puxaplaca.app).
// Formato confirmado com a documentação oficial deles:
// GET https://api.puxaplaca.app/v2/consulta/{placa}
// Header: token: {token}
// Resposta: { error, message, basico: { error, message, dados: {marca, modelo,
// cor, ano, anoModelo, ...} }, chassi: { dados: { chassi } }, ... }
import { corsHeaders } from '../_shared/cors.ts'
import { autenticarFuncionario, criarClienteAdmin } from '../_shared/auth.ts'

function mapearResposta(resposta: any) {
  const basico = resposta?.basico?.dados ?? {}
  const chassi = resposta?.chassi?.dados?.chassi ?? null
  return {
    marca: basico.marca ?? null,
    modelo: basico.modelo ?? null,
    cor: basico.cor ?? null,
    ano: basico.ano != null ? String(basico.ano) : null,
    anoModelo: basico.anoModelo != null ? String(basico.anoModelo) : null,
    chassi,
    // Já vêm inclusos na consulta "Básica" (sem custo adicional) — só não
    // estavam sendo lidos aqui antes.
    motor: basico.motor ?? null,
    combustivel: basico.combustivel ?? null,
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const admin = criarClienteAdmin()

  try {
    await autenticarFuncionario(req, admin, 'veiculos.visualizar')
    const { placa } = await req.json()
    if (!placa) throw new Error('PLACA_OBRIGATORIA')

    const token = Deno.env.get('API_PLACAS_TOKEN')
    if (!token) throw new Error('API_PLACAS_TOKEN não configurado nos secrets da Edge Function')

    const placaLimpa = String(placa).trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
    const resp = await fetch(`https://api.puxaplaca.app/v2/consulta/${placaLimpa}`, {
      headers: { token, Accept: 'application/json' },
    })
    const resposta = await resp.json().catch(() => ({}))

    if (!resp.ok || resposta?.error === true) {
      throw new Error(resposta?.message || 'Não foi possível consultar os dados dessa placa')
    }
    if (resposta?.basico?.error === true) {
      throw new Error(resposta.basico.message || 'SEM_RESULTADOS: nenhum dado básico encontrado para essa placa')
    }

    return new Response(JSON.stringify({ dados: mapearResposta(resposta) }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : String(error)
    return new Response(JSON.stringify({ error: mensagem }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
