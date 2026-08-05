// Consulta nome completo e data de nascimento pelo CPF via Hub do
// Desenvolvedor (hubdodesenvolvedor.com.br).
// Formato confirmado direto na API:
// GET https://ws.hubdodesenvolvedor.com.br/v2/cpf/?cpf={cpf}&token={token}
// Resposta: { status, return: "OK"|"NOK", message?, result?: { nome_da_pf,
// data_nascimento: "DD/MM/AAAA", situacao_cadastral, ... } }
import { corsHeaders } from '../_shared/cors.ts'
import { autenticarFuncionario, criarClienteAdmin } from '../_shared/auth.ts'

function dataBrParaIso(data: string | undefined | null): string | null {
  if (!data) return null
  const [dia, mes, ano] = data.split('/')
  if (!dia || !mes || !ano) return null
  return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const admin = criarClienteAdmin()

  try {
    await autenticarFuncionario(req, admin, 'clientes.visualizar')
    const { cpf } = await req.json()
    if (!cpf) throw new Error('CPF_OBRIGATORIO')

    const token = Deno.env.get('HUB_DESENVOLVEDOR_TOKEN')
    if (!token) throw new Error('HUB_DESENVOLVEDOR_TOKEN não configurado nos secrets da Edge Function')

    const cpfLimpo = String(cpf).trim().replace(/\D/g, '')
    if (cpfLimpo.length !== 11) throw new Error('CPF_INVALIDO')

    const resp = await fetch(`https://ws.hubdodesenvolvedor.com.br/v2/cpf/?cpf=${cpfLimpo}&token=${token}`, {
      headers: { Accept: 'application/json' },
    })
    const resposta = await resp.json().catch(() => ({}))

    if (!resp.ok || resposta?.status !== true) {
      const mensagem = resposta?.message || 'Não foi possível consultar os dados desse CPF'
      // CPF bem formado mas não encontrado na base — não é bem um "erro" pro
      // usuário, só não tem o que preencher automaticamente.
      if (/nao encontrado|não encontrado|invalido|inválido/i.test(mensagem)) {
        throw new Error(`SEM_RESULTADOS: ${mensagem}`)
      }
      throw new Error(mensagem)
    }

    const resultado = resposta.result ?? {}

    return new Response(
      JSON.stringify({
        dados: {
          nome: resultado.nome_da_pf ?? null,
          dataNascimento: dataBrParaIso(resultado.data_nascimento),
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : String(error)
    return new Response(JSON.stringify({ error: mensagem }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
