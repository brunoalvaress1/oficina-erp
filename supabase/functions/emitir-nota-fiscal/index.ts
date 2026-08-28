// Emite NFC-e/NF-e para as PEÇAS de uma OS já recebida no Caixa (Fase 1 — mão
// de obra/serviço fica de fora, isso é NFS-e e é uma integração separada, ver
// emitir-nfse/index.ts).
//
// Payload e lógica de sucesso conferidos contra a especificação OpenAPI oficial
// da Focus (doc.focusnfe.com.br) — inclusive campos exigidos (local_destino) e
// o fato de a emissão de NFC-e ser síncrona (o resultado final já vem na
// resposta do POST), enquanto a de NF-e pode ser assíncrona (HTTP 202,
// "processando_autorizacao" — precisa consultar depois). Ainda assim, nunca
// foi testado contra uma conta real (aguardando credenciamento na Sefaz) —
// emita uma nota de teste em homologação antes de confiar de olhos fechados.
import { corsHeaders } from '../_shared/cors.ts'
import { autenticarFuncionario, criarClienteAdmin } from '../_shared/auth.ts'
import { CODIGO_FORMA_PAGAMENTO_SEFAZ, dataEmissaoBrasilia, focusNfePost, normalizarUf, resolverCaminhoFocus, type AmbienteNfe } from '../_shared/focusnfe.ts'

type TipoNota = 'nfce' | 'nfe'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const admin = criarClienteAdmin()

  try {
    const funcionario = await autenticarFuncionario(req, admin, 'notas_fiscais.emitir')
    const { caixaLancamentoId, tipo } = await req.json()
    if (!caixaLancamentoId) throw new Error('CAIXA_LANCAMENTO_ID_OBRIGATORIO')
    const tipoNota: TipoNota = tipo === 'nfe' ? 'nfe' : 'nfce'

    // 1. Carrega o lançamento + OS (dados vêm do servidor, não do client, pra
    // ninguém conseguir montar uma nota com valores diferentes do que foi
    // realmente recebido no Caixa).
    const { data: lancamento, error: erroLancamento } = await admin
      .from('caixa_lancamentos')
      .select('id, oficina_id, status, ordem_servico_id')
      .eq('id', caixaLancamentoId)
      .single()
    if (erroLancamento || !lancamento) throw new Error('LANCAMENTO_NAO_ENCONTRADO')
    if (lancamento.status !== 'recebido') throw new Error('LANCAMENTO_NAO_RECEBIDO')

    const { data: notaExistente } = await admin
      .from('notas_fiscais_saida')
      .select('id, status')
      .eq('caixa_lancamento_id', caixaLancamentoId)
      .not('status', 'in', '(cancelada,erro,rejeitada)')
      .maybeSingle()
    if (notaExistente) throw new Error('NOTA_JA_EMITIDA')

    const { data: ordem, error: erroOrdem } = await admin
      .from('ordens_servico')
      .select('id, numero, cliente_id, valor_total')
      .eq('id', lancamento.ordem_servico_id)
      .single()
    if (erroOrdem || !ordem) throw new Error('ORDEM_NAO_ENCONTRADA')

    const { data: itensOrdem, error: erroItens } = await admin
      .from('ordem_servico_itens')
      .select('id, tipo, produto_id, descricao, quantidade, valor_unitario, valor_total')
      .eq('ordem_servico_id', ordem.id)
      .in('tipo', ['produto_estoque', 'produto_terceirizado'])
    if (erroItens) throw new Error(erroItens.message)
    if (!itensOrdem || itensOrdem.length === 0) throw new Error('SEM_ITENS_DE_PECA')

    const valorTotalPecas = itensOrdem.reduce((soma, item) => soma + Number(item.valor_total), 0)

    // Config de ambiente + imposto padrão — vive em `integracoes`, não tem
    // token nenhum ali (o token real é o FOCUS_NFE_TOKEN do secret).
    const { data: integracao } = await admin
      .from('integracoes')
      .select('config, status')
      .eq('oficina_id', lancamento.oficina_id)
      .eq('codigo', 'nfe')
      .maybeSingle()
    if (!integracao?.status) throw new Error('NFE_NAO_CONFIGURADA: ative a integração de Nota Fiscal em Configurações antes de emitir.')
    const ambiente: AmbienteNfe = (integracao.config as any)?.ambiente === 'producao' ? 'producao' : 'homologacao'
    const impostoPadraoId: string | null = (integracao.config as any)?.impostoPadraoId ?? null
    // Série manual da NF-e — só usada se configurada (Configurações > Nota
    // Fiscal). Sem isso, a Focus numera sozinha (comportamento padrão, igual
    // sempre foi). Necessário quando o CNPJ da oficina já tem NF-e emitida
    // por outro sistema/prestador antes desse, no mesmo CNPJ+série+modelo —
    // a Focus não sabe disso e a Sefaz rejeita com "Duplicidade de NF-e com
    // diferença na Chave de Acesso" ao repetir um número já usado
    // historicamente na série 1. Assumir controle com uma série nova (nunca
    // usada por ninguém) resolve de vez, sem depender do painel da Focus.
    const serieNfeManual: number | null = (integracao.config as any)?.serieNfe ? Number((integracao.config as any).serieNfe) : null

    let impostoPadrao: any = null
    if (impostoPadraoId) {
      const { data } = await admin
        .from('impostos')
        .select('ncm, cfop, icms_percentual, classe_fiscal, origem')
        .eq('id', impostoPadraoId)
        .maybeSingle()
      impostoPadrao = data
    }

    const produtoIds = [...new Set(itensOrdem.map((i) => i.produto_id).filter(Boolean))]
    let produtos: any[] = []
    if (produtoIds.length > 0) {
      const { data, error: erroProdutos } = await admin
        .from('produtos')
        .select('id, nome, ncm, imposto_id, impostos(ncm, cfop, icms_percentual, classe_fiscal, origem)')
        .in('id', produtoIds)
      if (erroProdutos) throw new Error(erroProdutos.message)
      produtos = data ?? []
    }

    const produtoPorId = new Map(produtos.map((p: any) => [p.id, p]))
    const itensSemImposto = itensOrdem.filter((item) => {
      const produto = item.produto_id ? produtoPorId.get(item.produto_id) : null
      return !produto?.imposto_id && !impostoPadrao
    })
    if (itensSemImposto.length > 0) {
      throw new Error(
        `ITENS_SEM_IMPOSTO_CONFIGURADO: ${itensSemImposto.map((i) => i.descricao).join(', ')} — configure o imposto desses produtos em Produtos, ou configure um Imposto Padrão em Configurações → Nota Fiscal.`,
      )
    }

    const { data: cliente, error: erroCliente } = await admin
      .from('clientes')
      .select('nome, cpf_cnpj, cep, endereco, numero, bairro, cidade, estado, codigo_cidade, telefone, email, inscricao_estadual')
      .eq('id', ordem.cliente_id)
      .single()
    if (erroCliente || !cliente) throw new Error('CLIENTE_NAO_ENCONTRADO')
    // Checados um a um (em vez de uma mensagem genérica) porque a rejeição
    // da Sefaz por schema XML incompleto (ex: "Bairro destinatario não pode
    // ser vazio") é bem menos clara do que travar aqui, antes de sequer
    // tentar emitir, com o campo exato que falta.
    const camposFaltando: string[] = []
    if (!cliente.cpf_cnpj) camposFaltando.push('CPF/CNPJ')
    if (!cliente.endereco) camposFaltando.push('endereço (rua)')
    if (!cliente.bairro) camposFaltando.push('bairro')
    if (!cliente.codigo_cidade) camposFaltando.push('código do município')
    if (camposFaltando.length > 0) {
      throw new Error(
        `CLIENTE_SEM_CADASTRO_COMPLETO: falta ${camposFaltando.join(', ')} do cliente para emitir a nota — complete o cadastro em Clientes.`,
      )
    }
    // A Sefaz rejeita logradouro_destinatario com mais de 60 caracteres —
    // comum em cadastros importados onde o bairro ficou colado no endereço
    // (ex: "Rua X, Bairro Y") em vez de separado no campo próprio.
    if (cliente.endereco.length > 60) {
      throw new Error(
        `CLIENTE_ENDERECO_MUITO_LONGO: o endereço do cliente tem ${cliente.endereco.length} caracteres (máximo aceito pela Sefaz: 60) — encurte o campo "Rua" no cadastro do cliente, movendo o que sobrar pra "Bairro" ou "Complemento".`,
      )
    }

    const { data: oficina, error: erroOficina } = await admin
      .from('oficinas')
      .select('cnpj, razao_social, nome_fantasia, endereco, numero, bairro, cidade, estado, cep')
      .eq('id', lancamento.oficina_id)
      .single()
    if (erroOficina || !oficina) throw new Error('OFICINA_NAO_ENCONTRADA')
    if (!oficina.cnpj) throw new Error('OFICINA_SEM_CNPJ_CONFIGURADO')

    const { data: recebimento } = await admin
      .from('caixa_recebimentos')
      .select('id, caixa_recebimento_formas(valor, forma_pagamento)')
      .eq('caixa_lancamento_id', caixaLancamentoId)
      .eq('cancelado', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // A nota cobre só as peças (Fase 1), mas o que foi pago no Caixa cobre a
    // OS inteira (peças + mão de obra) — a Sefaz exige que a soma dos
    // pagamentos bata exatamente com o total da nota, então rateamos
    // proporcionalmente e ajustamos a última forma pra fechar centavo a centavo.
    const formasOriginais = recebimento?.caixa_recebimento_formas ?? []
    const valorTotalPago = formasOriginais.reduce((soma: number, f: any) => soma + Number(f.valor), 0)
    const proporcaoPecas = valorTotalPago > 0 ? valorTotalPecas / valorTotalPago : 1

    const formasPagamento = formasOriginais.map((f: any, indice: number) => {
      const ehUltima = indice === formasOriginais.length - 1
      const valorRateado = ehUltima
        ? Number(valorTotalPecas) -
          formasOriginais.slice(0, -1).reduce((soma: number, x: any) => soma + Math.round(Number(x.valor) * proporcaoPecas * 100) / 100, 0)
        : Math.round(Number(f.valor) * proporcaoPecas * 100) / 100
      return {
        forma_pagamento: CODIGO_FORMA_PAGAMENTO_SEFAZ[f.forma_pagamento] ?? '99',
        valor_pagamento: valorRateado.toFixed(2),
      }
    })

    // 3. Monta o payload da NFC-e (natureza_operacao/CFOP/CST podem precisar de
    // ajuste fino por estado — ver comentário no topo do arquivo).
    // A referência inclui timestamp pra cada tentativa ser única — se uma
    // tentativa anterior falhou (nunca chegou a ser autorizada pela Sefaz),
    // uma nova tentativa não pode esbarrar na referência da que deu erro.
    const referencia = `caixa-${caixaLancamentoId}-${Date.now()}`
    const itensPayload = itensOrdem.map((item, indice) => {
      // Itens de peça terceirizada (comprada avulsa pra essa OS) não têm
      // produto_id — não estão cadastrados no catálogo de Produtos.
      const produto = item.produto_id ? produtoPorId.get(item.produto_id) : undefined
      const imposto = produto?.impostos ?? impostoPadrao
      const quantidadeComercial = Number(item.quantidade).toFixed(4)
      const valorUnitarioComercial = Number(item.valor_unitario).toFixed(2)
      // vProd (valor_bruto) precisa bater EXATAMENTE com vUnCom × qCom — por
      // isso calculamos a partir dos mesmos valores já arredondados que
      // estamos mandando (não de item.valor_total, que já vem líquido de
      // desconto). Rejeição real da Sefaz quando um item tinha desconto:
      // "Valor do Produto difere do produto Valor Unitário de
      // Comercialização e Quantidade Comercial" — valor_total (líquido) era
      // mandado como se fosse o bruto, e a conta não fechava.
      const valorBrutoItem = (Number(valorUnitarioComercial) * Number(quantidadeComercial)).toFixed(2)
      const valorDesconto = Number(item.valor_desconto ?? 0)
      const valorLiquidoItem = Number(item.valor_total).toFixed(2)
      return {
        numero_item: String(indice + 1),
        codigo_produto: item.produto_id || item.id,
        descricao: item.descricao || produto?.nome || 'Peça',
        cfop: imposto?.cfop || '5102',
        codigo_ncm: (imposto?.ncm || produto?.ncm || '').replace(/\D/g, ''),
        unidade_comercial: 'UN',
        quantidade_comercial: quantidadeComercial,
        valor_unitario_comercial: valorUnitarioComercial,
        valor_bruto: valorBrutoItem,
        valor_desconto: valorDesconto > 0 ? valorDesconto.toFixed(2) : undefined,
        unidade_tributavel: 'UN',
        quantidade_tributavel: quantidadeComercial,
        valor_unitario_tributavel: valorUnitarioComercial,
        indicador_total: '1',
        icms_origem: imposto?.origem ?? '0',
        icms_situacao_tributaria: imposto?.classe_fiscal ?? '102',
        icms_aliquota: imposto?.icms_percentual != null ? Number(imposto.icms_percentual).toFixed(2) : undefined,
        // PIS/COFINS — o grupo é obrigatório em NF-e (a NFC-e aceitou sem, mas
        // a Sefaz rejeita NF-e com "sem grupo do PIS" se ele faltar). Não
        // calculamos PIS/COFINS por produto (não temos essa informação
        // cadastrada), então usamos CST 07 (Operação Isenta da Contribuição)
        // — é o próprio valor de exemplo da documentação oficial da Focus e
        // não exige base/alíquota/valor adicionais. Revisar com o contador se
        // o regime tributário exigir apuração de PIS/COFINS por item.
        pis_situacao_tributaria: '07',
        cofins_situacao_tributaria: '07',
        // IBS/CBS (Reforma Tributária) — obrigatório desde 2026 pra qualquer
        // regime, inclusive Simples Nacional. Usando as alíquotas de teste
        // oficiais do período de transição (0,1% IBS + 0,9% CBS, conforme
        // documentação da Focus) — revisar com o contador conforme a reforma
        // avança e as alíquotas de verdade entrarem em vigor. Base de cálculo
        // usa o valor LÍQUIDO (já descontado), que é o que de fato foi cobrado.
        ibs_cbs_situacao_tributaria: '000',
        ibs_cbs_classificacao_tributaria: '000001',
        ibs_cbs_base_calculo: valorLiquidoItem,
        cbs_aliquota: '0.90',
        cbs_valor: (Number(valorLiquidoItem) * 0.009).toFixed(2),
        ibs_uf_aliquota: '0.10',
        ibs_uf_valor: (Number(valorLiquidoItem) * 0.001).toFixed(2),
        ibs_mun_aliquota: '0.00',
        ibs_mun_valor: '0.00',
        ibs_valor_total: (Number(valorLiquidoItem) * 0.001).toFixed(2),
      }
    })

    // local_destino é obrigatório pelo schema oficial da Focus (1-Interna,
    // 2-Interestadual, 3-Exterior) — comparamos a UF da oficina com a do
    // cliente, normalizando primeiro (o campo Estado às vezes foi cadastrado
    // com o nome completo do estado em vez da sigla, ex: "São Paulo" x "SP").
    const ufOficina = normalizarUf(oficina.estado)
    const ufCliente = normalizarUf(cliente.estado)
    const localDestino = ufCliente && ufOficina && ufCliente !== ufOficina ? '2' : '1'
    const cpfCnpjClienteDigitos = cliente.cpf_cnpj.replace(/\D/g, '')
    const ehPessoaJuridicaCliente = cpfCnpjClienteDigitos.length > 11

    const payload: Record<string, unknown> = {
      natureza_operacao: 'Venda de mercadoria',
      data_emissao: dataEmissaoBrasilia(),
      presenca_comprador: '1',
      modalidade_frete: '9', // 9 = sem transporte (padrão pra venda de balcão)
      local_destino: localDestino,
      cnpj_emitente: oficina.cnpj.replace(/\D/g, ''),
      nome_destinatario: cliente.nome,
      cpf_destinatario: ehPessoaJuridicaCliente ? undefined : cpfCnpjClienteDigitos,
      cnpj_destinatario: ehPessoaJuridicaCliente ? cpfCnpjClienteDigitos : undefined,
      logradouro_destinatario: cliente.endereco,
      numero_destinatario: cliente.numero || 'S/N',
      bairro_destinatario: cliente.bairro,
      municipio_destinatario: cliente.cidade,
      uf_destinatario: ufCliente,
      cep_destinatario: (cliente.cep || '').replace(/\D/g, ''),
      codigo_municipio_destinatario: cliente.codigo_cidade,
      items: itensPayload,
      formas_pagamento: formasPagamento,
    }

    // NF-e comum exige alguns campos extras que a NFC-e não tem (ela já é
    // implicitamente venda presencial ao consumidor final). O indicador de
    // IE do destinatário depende de pessoa física x jurídica E de o cliente
    // ter IE cadastrada: "9" (não contribuinte) é só pra CPF; pra CNPJ a
    // Sefaz não aceita "não contribuinte" — só contribuinte com IE
    // (indicador "1", exige a IE real) ou isento de inscrição (indicador
    // "2"). Se marcamos "2" (isento) mas o CNPJ está registrado como
    // contribuinte ativo na base da Sefaz, ela rejeita mesmo assim com "IE
    // do destinatário não informada" — por isso "1" + IE real é usado sempre
    // que o cliente tiver IE cadastrada, e "2" fica só de fallback pra
    // cliente jurídico realmente sem IE.
    const ieClienteDigitos = (cliente.inscricao_estadual || '').replace(/\D/g, '')
    if (tipoNota === 'nfe') {
      payload.tipo_documento = '1' // 1 = saída
      payload.finalidade_emissao = '1' // 1 = normal
      payload.consumidor_final = '1'
      if (!ehPessoaJuridicaCliente) {
        payload.indicador_ie_destinatario = '9'
      } else if (ieClienteDigitos) {
        payload.indicador_ie_destinatario = '1'
        payload.inscricao_estadual_destinatario = ieClienteDigitos
      } else {
        payload.indicador_ie_destinatario = '2'
      }
      if (serieNfeManual) {
        payload.serie = serieNfeManual
        payload.numero = await proximoNumeroNfe(admin, lancamento.oficina_id, serieNfeManual)
      }
    }

    // 4. Envia pra Focus. A emissão de NFC-e é SÍNCRONA (a doc oficial da Focus
    // confirma isso) — o resultado final (autorizado ou rejeitado) já vem
    // nessa mesma resposta, não tem "processando" de verdade pra esperar depois.
    // A de NF-e pode vir assíncrona (HTTP 202, status "processando_autorizacao")
    // — nesse caso ainda não temos o resultado final, fica como "processando"
    // até o usuário clicar em "Verificar status" (consultar-nota-fiscal).
    // Importante: quem diz se deu certo é o campo "status" DENTRO do corpo
    // ("autorizado" | "erro_autorizacao" | "processando_autorizacao"), não o
    // código HTTP — a Focus devolve HTTP 201 tanto pra autorizado quanto pra
    // rejeitado pela Sefaz (código HTTP diferente, tipo 400/422, é só pra erro
    // de formato do nosso payload antes de sequer chegar na Sefaz).
    const caminhoEmissao = tipoNota === 'nfe' ? '/v2/nfe' : '/v2/nfce'
    const { data: respostaFocus } = await focusNfePost(ambiente, `${caminhoEmissao}?ref=${referencia}`, payload)
    const autorizada = respostaFocus?.status === 'autorizado'
    const processando = respostaFocus?.status === 'processando_autorizacao'
    const rejeitadaPelaSefaz = respostaFocus?.status === 'erro_autorizacao' || respostaFocus?.status === 'denegado'
    const statusInicial = autorizada ? 'autorizada' : processando ? 'processando' : rejeitadaPelaSefaz ? 'rejeitada' : 'erro'

    // Duas formas de erro possíveis: erro de formato (codigo/mensagem/erros,
    // antes de chegar na Sefaz) ou rejeição da própria Sefaz (mensagem_sefaz).
    const mensagemFocusLegivel = rejeitadaPelaSefaz
      ? respostaFocus?.mensagem_sefaz || 'Rejeitado pela Sefaz.'
      : !autorizada && !processando && Array.isArray(respostaFocus?.erros) && respostaFocus.erros.length > 0
        ? `${respostaFocus.mensagem ?? 'Erro na Focus'}: ${respostaFocus.erros.map((e: any) => e.mensagem).join('; ')}`
        : autorizada || processando
          ? null
          : respostaFocus?.mensagem || respostaFocus?.mensagem_sefaz || JSON.stringify(respostaFocus)

    const { data: notaCriada, error: erroInsert } = await admin
      .from('notas_fiscais_saida')
      .insert({
        oficina_id: lancamento.oficina_id,
        caixa_lancamento_id: caixaLancamentoId,
        ordem_servico_id: ordem.id,
        tipo: tipoNota,
        ambiente,
        status: statusInicial,
        referencia,
        numero: respostaFocus?.numero ?? null,
        serie: respostaFocus?.serie ?? null,
        chave_acesso: respostaFocus?.chave_nfe ?? null,
        protocolo_autorizacao: respostaFocus?.numero_protocolo ?? respostaFocus?.protocolo ?? null,
        url_danfe: resolverCaminhoFocus(ambiente, respostaFocus?.caminho_danfe),
        url_xml: resolverCaminhoFocus(ambiente, respostaFocus?.caminho_xml_nota_fiscal),
        qrcode_url: respostaFocus?.qrcode_url ?? null,
        // valorTotalPecas (não ordem.valor_total) — essa nota cobre só as
        // peças; usar o total da OS inteira (peça + serviço) inflava o valor
        // registrado sempre que a OS também tinha mão de obra.
        valor_total: valorTotalPecas,
        cliente_nome: cliente.nome,
        mensagem_erro: mensagemFocusLegivel,
        payload_enviado: payload,
        resposta_provedor: respostaFocus,
        criado_por: funcionario.id,
      })
      .select('*')
      .single()
    if (erroInsert) throw new Error(erroInsert.message)

    await admin.from('notas_fiscais_saida_historico').insert({
      nota_fiscal_id: notaCriada.id,
      status_anterior: null,
      status_novo: statusInicial,
      mensagem: autorizada
        ? 'Nota autorizada pela Sefaz.'
        : processando
          ? 'Nota enviada, aguardando autorização da Sefaz.'
          : mensagemFocusLegivel,
    })

    const sucesso = autorizada || processando
    return new Response(JSON.stringify({ nota: notaCriada, error: sucesso ? undefined : mensagemFocusLegivel }), {
      status: autorizada ? 200 : processando ? 202 : 422,
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

// Conta só dentro da mesma série manual configurada, e ignora tentativas com
// status "erro" (nunca chegaram a ser enviadas de verdade pra Sefaz — um erro
// de formato/validação antes de sequer tentar autorizar não deveria gastar
// número real). "rejeitada"/"processando"/"autorizada" contam, porque essas
// já foram de fato submetidas à Sefaz com aquele número.
async function proximoNumeroNfe(admin: ReturnType<typeof criarClienteAdmin>, oficinaId: string, serie: number): Promise<number> {
  const { count } = await admin
    .from('notas_fiscais_saida')
    .select('id', { count: 'exact', head: true })
    .eq('oficina_id', oficinaId)
    .eq('tipo', 'nfe')
    .eq('payload_enviado->>serie', String(serie))
    .neq('status', 'erro')
  return (count ?? 0) + 1
}
