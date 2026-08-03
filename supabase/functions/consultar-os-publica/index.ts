// Consulta pública (SEM autenticação) de uma OS — usada pela página
// /os/:id que o cliente acessa pelo link recebido no WhatsApp após pagar.
// Só devolve os campos necessários pro cliente conferir o serviço; nunca
// CPF/CNPJ, endereço completo, e-mail ou qualquer dado de OUTRO cliente.
import { corsHeaders } from '../_shared/cors.ts'
import { criarClienteAdmin } from '../_shared/auth.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const admin = criarClienteAdmin()

  try {
    const { ordemServicoId } = await req.json()
    if (!ordemServicoId) throw new Error('ORDEM_SERVICO_ID_OBRIGATORIO')

    const { data: ordem, error: erroOrdem } = await admin
      .from('ordens_servico')
      .select('id, numero, status, data_abertura, valor_total, cliente_id, oficina_id, veiculos(placa, modelo)')
      .eq('id', ordemServicoId)
      .single()
    if (erroOrdem || !ordem) throw new Error('ORDEM_NAO_ENCONTRADA')

    const { data: itens, error: erroItens } = await admin
      .from('ordem_servico_itens')
      .select('descricao, quantidade, valor_unitario, valor_total, tipo')
      .eq('ordem_servico_id', ordem.id)
    if (erroItens) throw new Error(erroItens.message)

    const { data: cliente } = await admin.from('clientes').select('nome').eq('id', ordem.cliente_id).maybeSingle()
    const { data: oficina } = await admin
      .from('oficinas')
      .select('nome_fantasia, razao_social, telefone, whatsapp, endereco, numero, bairro, cidade, estado, logo_url')
      .eq('id', ordem.oficina_id)
      .maybeSingle()

    const veiculo = Array.isArray(ordem.veiculos) ? ordem.veiculos[0] : ordem.veiculos

    return new Response(
      JSON.stringify({
        numero: ordem.numero,
        status: ordem.status,
        dataAbertura: ordem.data_abertura,
        valorTotal: ordem.valor_total,
        veiculoPlaca: veiculo?.placa ?? null,
        veiculoModelo: veiculo?.modelo ?? null,
        clienteNome: cliente?.nome ?? null,
        itens: (itens ?? []).map((i) => ({
          descricao: i.descricao,
          quantidade: Number(i.quantidade),
          valorUnitario: Number(i.valor_unitario),
          valorTotal: Number(i.valor_total),
          tipo: i.tipo,
        })),
        oficina: {
          nome: oficina?.nome_fantasia || oficina?.razao_social || 'Oficina',
          telefone: oficina?.telefone || oficina?.whatsapp || null,
          endereco: [oficina?.endereco, oficina?.numero, oficina?.bairro, oficina?.cidade, oficina?.estado]
            .filter(Boolean)
            .join(', '),
          logoUrl: oficina?.logo_url ?? null,
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
