// Status da conexão e geração de QR code da instância do WhatsApp (Evolution
// API), pra não depender de entrar no Manager externo toda vez que a sessão
// cair. Ação decidida pelo body: { acao: 'status' | 'qrcode' }.
import { corsHeaders } from '../_shared/cors.ts'
import { autenticarFuncionario, criarClienteAdmin } from '../_shared/auth.ts'
import { consultarStatusInstancia, gerarQrCodeInstancia } from '../_shared/whatsapp.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const admin = criarClienteAdmin()

  try {
    const funcionario = await autenticarFuncionario(req, admin, 'configuracoes.visualizar')
    const { acao } = await req.json()
    if (acao !== 'status' && acao !== 'qrcode') throw new Error('ACAO_INVALIDA')

    const { data: integracao } = await admin
      .from('integracoes')
      .select('config')
      .eq('oficina_id', funcionario.oficinaId)
      .eq('codigo', 'whatsapp')
      .maybeSingle()
    const instanceName: string | undefined = (integracao?.config as any)?.instanceName
    if (!instanceName) throw new Error('WHATSAPP_SEM_INSTANCIA: configure o nome da instância antes.')

    if (acao === 'status') {
      const { data } = await consultarStatusInstancia(instanceName)
      const estado = data?.instance?.state ?? data?.state ?? 'desconhecido'
      return new Response(JSON.stringify({ estado }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data } = await gerarQrCodeInstancia(instanceName)
    const qrCodeBase64: string | null = data?.base64 ?? null
    if (!qrCodeBase64) {
      // Já conectada não gera QR novo — a Evolution devolve só o estado.
      const estado = data?.instance?.state ?? data?.state
      return new Response(JSON.stringify({ qrCodeBase64: null, estado }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ qrCodeBase64 }), {
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
