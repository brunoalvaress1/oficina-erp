// Consulta razão social e endereço pelo CNPJ via Hub do Desenvolvedor
// (hubdodesenvolvedor.com.br) — mesmo provedor/token da consulta de CPF.
// GET https://ws.hubdodesenvolvedor.com.br/v2/cnpj/?cnpj={cnpj}&token={token}
// Resposta: { status, return: "OK"|"NOK", message?, result?: { nome,
// fantasia, telefone, email, logradouro, numero, bairro, municipio, uf,
// cep, situacao, ... } }
import { corsHeaders } from '../_shared/cors.ts'
import { autenticarFuncionario, criarClienteAdmin } from '../_shared/auth.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const admin = criarClienteAdmin()

  try {
    await autenticarFuncionario(req, admin, 'clientes.visualizar')
    const { cnpj } = await req.json()
    if (!cnpj) throw new Error('CNPJ_OBRIGATORIO')

    const token = Deno.env.get('HUB_DESENVOLVEDOR_TOKEN')
    if (!token) throw new Error('HUB_DESENVOLVEDOR_TOKEN não configurado nos secrets da Edge Function')

    const cnpjLimpo = String(cnpj).trim().replace(/\D/g, '')
    if (cnpjLimpo.length !== 14) throw new Error('CNPJ_INVALIDO')

    const resp = await fetch(`https://ws.hubdodesenvolvedor.com.br/v2/cnpj/?cnpj=${cnpjLimpo}&token=${token}`, {
      headers: { Accept: 'application/json' },
    })
    const resposta = await resp.json().catch(() => ({}))

    if (!resp.ok || resposta?.status !== true) {
      const mensagem = resposta?.message || 'Não foi possível consultar os dados desse CNPJ'
      // CNPJ bem formado mas não encontrado na base não é bem um "erro" pro
      // usuário, só não tem o que preencher automaticamente.
      if (/nao encontrado|não encontrado|invalido|inválido/i.test(mensagem)) {
        throw new Error(`SEM_RESULTADOS: ${mensagem}`)
      }
      throw new Error(mensagem)
    }

    const r = resposta.result ?? {}

    return new Response(
      JSON.stringify({
        dados: {
          nome: r.nome ?? null,
          telefone: r.telefone ?? null,
          email: r.email ?? null,
          cep: r.cep ?? null,
          endereco: r.logradouro ?? null,
          numero: r.numero ?? null,
          bairro: r.bairro ?? null,
          cidade: r.municipio ?? null,
          estado: r.uf ?? null,
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
