// Emite NFS-e Nacional para o SERVIÇO (mão de obra) de uma OS já recebida no
// Caixa — separada da nota de peças (NFC-e/NF-e, ver emitir-nota-fiscal), pois
// no Brasil mercadoria (ICMS, estadual) e serviço (ISS, municipal) são
// documentos fiscais diferentes.
//
// Baseado na especificação oficial do Emissor Nacional de NFS-e via Focus
// (doc.focusnfe.com.br/reference/emitir_dps_nacional.md, endpoint POST
// /nfsen) e na referência completa de campos em
// campos.focusnfe.com.br/nfse_nacional/EmissaoDPSXml.html (o primeiro link
// não lista todos os campos exigidos pelo XML nacional — só descobrimos os
// grupos "toma"/"tribMun"/"trib" faltando depois de uma rejeição real da
// Sefaz). Essa API é nova (obrigatória desde 01/01/2026) e alguns campos de
// enumeração (codigo_opcao_simples_nacional, regime_especial_tributacao,
// tributacao_iss, emitente_dps) não têm uma tabela de valores documentada de
// forma clara na doc pública — usamos os valores mais comuns pra prestação de
// serviço comum (oficina mecânica), mas CONFIRME com o contador antes de
// emitir em produção. O código de tributação nacional do ISS
// (codigo_tributacao_nacional_iss) é configurável em Configurações → Nota
// Fiscal justamente por causa dessa incerteza.
import { corsHeaders } from '../_shared/cors.ts'
import { autenticarFuncionario, criarClienteAdmin } from '../_shared/auth.ts'
import { dataEmissaoBrasilia, focusNfePost, type AmbienteNfe } from '../_shared/focusnfe.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const admin = criarClienteAdmin()

  try {
    const funcionario = await autenticarFuncionario(req, admin, 'notas_fiscais.emitir')
    const { caixaLancamentoId } = await req.json()
    if (!caixaLancamentoId) throw new Error('CAIXA_LANCAMENTO_ID_OBRIGATORIO')

    const { data: lancamento, error: erroLancamento } = await admin
      .from('caixa_lancamentos')
      .select('id, oficina_id, status, ordem_servico_id')
      .eq('id', caixaLancamentoId)
      .single()
    if (erroLancamento || !lancamento) throw new Error('LANCAMENTO_NAO_ENCONTRADO')
    if (lancamento.status !== 'recebido') throw new Error('LANCAMENTO_NAO_RECEBIDO')

    // Diferente da nota de peças: NFC-e/NF-e e NFS-e são documentos
    // independentes pra mesma venda, então o filtro de duplicidade é só
    // dentro do próprio tipo 'nfse'.
    const { data: notaExistente } = await admin
      .from('notas_fiscais_saida')
      .select('id, status')
      .eq('caixa_lancamento_id', caixaLancamentoId)
      .eq('tipo', 'nfse')
      .not('status', 'in', '(cancelada,erro,rejeitada)')
      .maybeSingle()
    if (notaExistente) throw new Error('NOTA_JA_EMITIDA')

    const { data: ordem, error: erroOrdem } = await admin
      .from('ordens_servico')
      .select('id, numero, cliente_id')
      .eq('id', lancamento.ordem_servico_id)
      .single()
    if (erroOrdem || !ordem) throw new Error('ORDEM_NAO_ENCONTRADA')

    const { data: itensServico, error: erroItens } = await admin
      .from('ordem_servico_itens')
      .select('id, descricao, valor_total')
      .eq('ordem_servico_id', ordem.id)
      .eq('tipo', 'servico')
    if (erroItens) throw new Error(erroItens.message)
    if (!itensServico || itensServico.length === 0) throw new Error('SEM_ITENS_DE_SERVICO')

    const valorServico = itensServico.reduce((soma, item) => soma + Number(item.valor_total), 0)

    const { data: integracao } = await admin
      .from('integracoes')
      .select('config, status')
      .eq('oficina_id', lancamento.oficina_id)
      .eq('codigo', 'nfe')
      .maybeSingle()
    if (!integracao?.status) throw new Error('NFE_NAO_CONFIGURADA: ative a integração de Nota Fiscal em Configurações antes de emitir.')
    const ambiente: AmbienteNfe = (integracao.config as any)?.ambiente === 'producao' ? 'producao' : 'homologacao'
    const codigoTributacaoIss: string = (integracao.config as any)?.codigoTributacaoIss || '140101'
    // Código NBS, obrigatório sempre que a nota informar IBS/CBS (Reforma
    // Tributária). Valor conferido linha a linha na planilha oficial
    // "Anexo VIII" (gov.br/nfse) pro item LC116 14.01: NBS 1.2001.31.10 =
    // "Serviços de manutenção e reparação de veículos rodoviários
    // motorizados" (120013110) — NÃO é o "1.2001.31.00" que a maioria dos
    // sites de terceiros cita (esse código não existe na tabela oficial, só
    // existe com a subdivisão ".10" motorizado / ".20" não motorizado).
    const codigoNbs: string = (integracao.config as any)?.codigoNbs || '120013110'
    // cIndOp correspondente ao NBS acima, na mesma linha da planilha oficial:
    // 050101 = prestação de serviço onerosa e não vinculada a operação com o
    // exterior — o caso normal de serviço pago por cliente doméstico.
    const codigoIndicadorOperacao: string = (integracao.config as any)?.codigoIndicadorOperacao || '050101'

    const { data: cliente, error: erroCliente } = await admin
      .from('clientes')
      .select('nome, cpf_cnpj, cep, endereco, numero, bairro, codigo_cidade')
      .eq('id', ordem.cliente_id)
      .single()
    if (erroCliente || !cliente) throw new Error('CLIENTE_NAO_ENCONTRADO')
    if (!cliente.cpf_cnpj) throw new Error('CLIENTE_SEM_CADASTRO_COMPLETO: falta CPF/CNPJ do cliente para emitir a nota.')
    if (!cliente.codigo_cidade) throw new Error('CLIENTE_SEM_CADASTRO_COMPLETO: falta o código do município do cliente para emitir a nota.')

    const { data: oficina, error: erroOficina } = await admin
      .from('oficinas')
      .select('cnpj, codigo_municipio, regime_tributario')
      .eq('id', lancamento.oficina_id)
      .single()
    if (erroOficina || !oficina) throw new Error('OFICINA_NAO_ENCONTRADA')
    if (!oficina.cnpj) throw new Error('OFICINA_SEM_CNPJ_CONFIGURADO')
    if (!oficina.codigo_municipio) {
      throw new Error('OFICINA_SEM_CODIGO_MUNICIPIO: configure o Código do Município (IBGE) em Configurações → Dados da Oficina antes de emitir NFS-e.')
    }

    const cpfCnpjCliente = cliente.cpf_cnpj.replace(/\D/g, '')
    const ehPessoaJuridica = cpfCnpjCliente.length > 11

    // Simples Nacional (exceto MEI) = 3, demais regimes = 1 (não optante) —
    // valores usuais da tabela nacional de opção pelo Simples. Ajustar se o
    // contador confirmar um valor diferente pro caso da oficina.
    const codigoOpcaoSimplesNacional = oficina.regime_tributario === 'simples_nacional' ? 3 : 1

    const referencia = `caixa-${caixaLancamentoId}-nfse-${Date.now()}`
    const codigoMunicipio = Number(oficina.codigo_municipio)
    const descricaoServico = `Mão de obra referente à OS nº ${ordem.numero}: ${itensServico.map((i) => i.descricao).join(', ')}`.slice(0, 2000)

    const dataEmissao = dataEmissaoBrasilia()
    const payload = {
      data_emissao: dataEmissao,
      serie_dps: 1,
      // Número da DPS precisa ser único por prestador+série+município — na
      // ausência de um contador dedicado, usamos a contagem de NFS-e já
      // emitidas por essa oficina +1. Se uma nota for excluída do histórico
      // manualmente isso pode colidir; o erro da Focus nesse caso é claro
      // (E0014) e a emissão pode ser refeita com uma nova referência.
      numero_dps: await proximoNumeroDps(admin, lancamento.oficina_id),
      data_competencia: dataEmissao.slice(0, 10),
      emitente_dps: 1, // 1 = prestador emite a própria DPS (caso normal)
      codigo_municipio_emissora: codigoMunicipio,
      cnpj_prestador: oficina.cnpj.replace(/\D/g, ''),
      codigo_opcao_simples_nacional: codigoOpcaoSimplesNacional,
      // Obrigatório quando optante do Simples Nacional (ME/EPP) — 1 = regime
      // de apuração dos tributos federais E municipal pelo SN, o caso normal
      // pra quem não tem legislação municipal específica de ISS por fora do
      // SN. Rejeição real da Sefaz: "obrigatório o preenchimento do regime de
      // apuração dos tributos do SN para o optante do Simples Nacional ME/EPP".
      regime_tributario_simples_nacional: codigoOpcaoSimplesNacional !== 1 ? 1 : undefined,
      regime_especial_tributacao: 0, // 0 = nenhum regime especial
      cnpj_tomador: ehPessoaJuridica ? cpfCnpjCliente : undefined,
      cpf_tomador: !ehPessoaJuridica ? cpfCnpjCliente : undefined,
      razao_social_tomador: cliente.nome,
      codigo_municipio_tomador: Number(cliente.codigo_cidade),
      // CEP é opcional na DPS, mas quando informado a Sefaz cruza com o
      // município — um CEP com menos de 8 dígitos (erro de digitação no
      // cadastro) sempre é rejeitado ("CEP não existe ou não pertence ao
      // município"). Melhor omitir um CEP malformado do que travar a emissão.
      cep_tomador: cepTomadorValido(cliente.cep),
      logradouro_tomador: cliente.endereco || undefined,
      numero_tomador: cliente.numero || undefined,
      bairro_tomador: cliente.bairro || undefined,
      codigo_municipio_prestacao: codigoMunicipio,
      codigo_tributacao_nacional_iss: codigoTributacaoIss,
      // Obrigatório porque a nota informa dados de IBS/CBS ("É obrigatório
      // informar na DPS um item da NBS se for declarada qualquer informação
      // de IBS/CBS" — rejeição real da Sefaz).
      codigo_nbs: codigoNbs,
      descricao_servico: descricaoServico,
      valor_servico: Number(valorServico.toFixed(2)),
      tributacao_iss: 1, // 1 = tributável integralmente (caso normal)
      // Sem retenção na fonte (caso normal pra cliente pessoa física/oficina
      // comum) e sem informar valor total de tributos aproximado (Lei da
      // Transparência) — mas os campos precisam existir pra fechar os grupos
      // "tribMun" e "trib" do XML nacional (a Sefaz rejeitou a nota sem eles:
      // "Missing child element" em tribMun/trib).
      tipo_retencao_iss: 1, // 1 = não retido
      // O grupo "trib" do XML exige OU totTrib (indicador_total_tributacao)
      // OU tribFed (campos de retenção federal) — nunca os dois, e a Sefaz
      // rejeita totTrib pra optante do Simples Nacional ME/EPP ("não pode ser
      // informado"). Por isso ramifica: não-Simples usa totTrib=0 (não
      // informado), Simples Nacional usa tribFed zerado (sem retenção
      // federal, o caso normal — ME/EPP recolhe tudo pelo DAS).
      indicador_total_tributacao: codigoOpcaoSimplesNacional === 1 ? 0 : undefined,
      // Dentro de tribFed, o XML exige a CST do PIS/COFINS ANTES da base de
      // cálculo — "00" = Nenhum, o caso de quem não apura PIS/COFINS por
      // fora do DAS (ME/EPP do Simples Nacional).
      situacao_tributaria_pis_cofins: codigoOpcaoSimplesNacional !== 1 ? '00' : undefined,
      base_calculo_pis_cofins: codigoOpcaoSimplesNacional !== 1 ? 0 : undefined,
      aliquota_pis: codigoOpcaoSimplesNacional !== 1 ? 0 : undefined,
      aliquota_cofins: codigoOpcaoSimplesNacional !== 1 ? 0 : undefined,
      valor_pis: codigoOpcaoSimplesNacional !== 1 ? 0 : undefined,
      valor_cofins: codigoOpcaoSimplesNacional !== 1 ? 0 : undefined,
      tipo_retencao_pis_cofins: codigoOpcaoSimplesNacional !== 1 ? 1 : undefined, // 1 = não retido
      valor_cp: codigoOpcaoSimplesNacional !== 1 ? 0 : undefined,
      valor_irrf: codigoOpcaoSimplesNacional !== 1 ? 0 : undefined,
      valor_csll: codigoOpcaoSimplesNacional !== 1 ? 0 : undefined,
      // Campos da Reforma Tributária, obrigatórios no layout nacional de DPS.
      // codigo_indicador_operacao (cIndOp) é exigido pela Sefaz antes de
      // indicador_destinatario (indDest) na sequência do XML — valor vem da
      // mesma linha da planilha oficial Anexo VIII usada pro código NBS acima.
      codigo_indicador_operacao: codigoIndicadorOperacao,
      finalidade_emissao: 0, // 0 = NFS-e normal
      consumidor_final: 1,
      indicador_destinatario: 0, // 0 = tomador é o destinatário da operação
      ibs_cbs_situacao_tributaria: '000',
      ibs_cbs_classificacao_tributaria: '000001',
    }

    // NFS-e Nacional é SEMPRE assíncrona — a Focus só devolve
    // "processando_autorizacao" no POST, o resultado final só vem numa
    // consulta posterior (botão "Verificar status").
    const { data: respostaFocus } = await focusNfePost(ambiente, `/v2/nfsen?ref=${referencia}`, payload)
    const processando = respostaFocus?.status === 'processando_autorizacao'
    const rejeitadaPelaSefaz = respostaFocus?.status === 'erro_autorizacao' || respostaFocus?.status === 'negado'
    const statusInicial = processando ? 'processando' : rejeitadaPelaSefaz ? 'rejeitada' : 'erro'

    const mensagemFocusLegivel = processando
      ? null
      : Array.isArray(respostaFocus?.erros) && respostaFocus.erros.length > 0
        ? respostaFocus.erros.map((e: any) => e.mensagem).join('; ')
        : respostaFocus?.mensagem || JSON.stringify(respostaFocus)

    const { data: notaCriada, error: erroInsert } = await admin
      .from('notas_fiscais_saida')
      .insert({
        oficina_id: lancamento.oficina_id,
        caixa_lancamento_id: caixaLancamentoId,
        ordem_servico_id: ordem.id,
        tipo: 'nfse',
        ambiente,
        status: statusInicial,
        referencia,
        valor_total: valorServico,
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
      mensagem: processando ? 'DPS enviada, aguardando autorização da prefeitura/portal nacional.' : mensagemFocusLegivel,
    })

    return new Response(JSON.stringify({ nota: notaCriada, error: processando ? undefined : mensagemFocusLegivel }), {
      status: processando ? 202 : 422,
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

function cepTomadorValido(cep: string | null | undefined): string | undefined {
  const limpo = (cep || '').replace(/\D/g, '')
  return limpo.length === 8 ? limpo : undefined
}

async function proximoNumeroDps(admin: ReturnType<typeof criarClienteAdmin>, oficinaId: string): Promise<number> {
  const { count } = await admin
    .from('notas_fiscais_saida')
    .select('id', { count: 'exact', head: true })
    .eq('oficina_id', oficinaId)
    .eq('tipo', 'nfse')
  return (count ?? 0) + 1
}
