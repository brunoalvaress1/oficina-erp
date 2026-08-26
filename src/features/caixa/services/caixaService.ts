import { supabase } from '@/lib/supabase'
import { capturarIpPublico } from '@/utils/capturarIp'
import type { TaxaMaquininha } from '@/features/configuracoes/types/pagamentos'
import type {
  CaixaLancamento,
  CaixaLancamentoDetalhe,
  CaixaLancamentoHistoricoEntry,
  CaixaRecebimento,
  DashboardCaixa,
  FormaPagamento,
  FormaPagamentoInput,
  ListarCaixaParams,
  ListarCaixaResult,
  ListarHistoricoCaixaParams,
  ListarHistoricoCaixaResult,
} from '../types/caixa'
import type { GrupoTaxaMaquininha } from '../types/bandeiraCartao'

// Limites de um "dia" no fuso horário local do navegador (não UTC) — usar
// toISOString().slice(0,10) direto faria o dia "virar" no horário de UTC-3
// (por volta das 21h em Brasília), cortando os recebimentos da noite.
function limitesDoDiaLocal(dataBase?: string): { inicio: string; fim: string } {
  const base = dataBase ? new Date(`${dataBase}T00:00:00`) : new Date()
  const inicio = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 0, 0, 0, 0)
  const fim = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 23, 59, 59, 999)
  return { inicio: inicio.toISOString(), fim: fim.toISOString() }
}

const SELECT_LANCAMENTO = `
  *,
  ordens_servico (
    numero, numero_prisma, cliente_id, valor_total, valor_desconto, data_abertura,
    clientes (nome, telefone),
    veiculos (placa, modelo),
    responsavel:funcionarios!ordens_servico_responsavel_id_fkey (nome)
  ),
  caixa_recebimentos (desconto, cancelado)
`

function mapLancamento(row: any): CaixaLancamento {
  const ordem = row.ordens_servico
  return {
    id: row.id,
    oficinaId: row.oficina_id,
    ordemServicoId: row.ordem_servico_id,
    status: row.status,
    observacoes: row.observacoes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ordemNumero: Number(ordem?.numero ?? 0),
    ordemNumeroPrisma: ordem?.numero_prisma ?? null,
    clienteId: ordem?.cliente_id,
    clienteNome: ordem?.clientes?.nome ?? null,
    clienteTelefone: ordem?.clientes?.telefone ?? null,
    veiculoPlaca: ordem?.veiculos?.placa ?? null,
    veiculoModelo: ordem?.veiculos?.modelo ?? null,
    responsavelNome: ordem?.responsavel?.nome ?? null,
    valorTotal: Number(ordem?.valor_total ?? 0),
    valorDesconto: Number(ordem?.valor_desconto ?? 0),
    descontoRecebimento: (row.caixa_recebimentos ?? [])
      .filter((r: any) => !r.cancelado)
      .reduce((soma: number, r: any) => soma + Number(r.desconto ?? 0), 0),
    dataAbertura: ordem?.data_abertura,
  }
}

function mapRecebimento(row: any): CaixaRecebimento {
  return {
    id: row.id,
    caixaLancamentoId: row.caixa_lancamento_id,
    funcionarioId: row.funcionario_id,
    funcionarioNome: row.funcionarios?.nome,
    valorTotal: Number(row.valor_total ?? 0),
    cancelado: row.cancelado,
    motivoCancelamento: row.motivo_cancelamento,
    canceladoPor: row.cancelado_por,
    canceladoEm: row.cancelado_em,
    createdAt: row.created_at,
  }
}

function mapHistorico(row: any): CaixaLancamentoHistoricoEntry {
  return {
    id: row.id,
    caixaLancamentoId: row.caixa_lancamento_id,
    funcionarioId: row.funcionario_id,
    funcionarioNome: row.funcionarios?.nome,
    acao: row.acao,
    detalhes: row.detalhes,
    ip: row.ip,
    createdAt: row.created_at,
  }
}

function traduzirErro(mensagem: string): string {
  if (mensagem.includes('CAIXA_FECHADO')) return 'O caixa precisa estar aberto para receber pagamentos.'
  if (mensagem.includes('VALOR_NAO_CONFERE')) return 'A soma das formas de pagamento não bate com o valor da ordem.'
  if (mensagem.includes('LANCAMENTO_JA_PROCESSADO')) return 'Este lançamento já foi recebido ou está pendente.'
  if (mensagem.includes('LANCAMENTO_NAO_ENCONTRADO')) return 'Lançamento não encontrado.'
  if (mensagem.includes('LANCAMENTO_NAO_RECEBIDO')) return 'Este lançamento ainda não foi recebido.'
  if (mensagem.includes('RECEBIMENTO_NAO_ENCONTRADO')) return 'Recebimento não encontrado.'
  return mensagem
}

async function buscarIdsOrdensPorTexto(termo: string): Promise<string[]> {
  const escapado = termo.replace(/,/g, ' ')
  const condicoes = [
    `numero_prisma.ilike.%${escapado}%`,
    `clientes.nome.ilike.%${escapado}%`,
    `clientes.cpf_cnpj.ilike.%${escapado}%`,
    `clientes.telefone.ilike.%${escapado}%`,
    `veiculos.placa.ilike.%${escapado}%`,
    `veiculos.modelo.ilike.%${escapado}%`,
  ]
  if (/^\d+$/.test(termo.trim())) condicoes.push(`numero.eq.${termo.trim()}`)

  const { data, error } = await supabase
    .from('ordens_servico')
    .select('id, clientes(nome, cpf_cnpj, telefone), veiculos(placa, modelo)')
    .or(condicoes.join(','))

  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => row.id)
}

export async function listarCaixaLancamentos(params: ListarCaixaParams = {}): Promise<ListarCaixaResult> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 20
  const search = params.search?.trim() ?? ''
  const filtro = params.filtro ?? 'todas'

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase.from('caixa_lancamentos').select(SELECT_LANCAMENTO, { count: 'exact' })

  if (filtro === 'aguardando') query = query.eq('status', 'aguardando')
  if (filtro === 'pendente') query = query.eq('status', 'pendente')
  if (filtro === 'recebidas_hoje') {
    const { inicio, fim } = limitesDoDiaLocal()
    query = query.eq('status', 'recebido').gte('updated_at', inicio).lte('updated_at', fim)
  }
  if (filtro === 'recebidas_periodo' && params.dataInicio && params.dataFim) {
    const { inicio } = limitesDoDiaLocal(params.dataInicio)
    const { fim } = limitesDoDiaLocal(params.dataFim)
    query = query.eq('status', 'recebido').gte('updated_at', inicio).lte('updated_at', fim)
  }

  if (search) {
    const ids = await buscarIdsOrdensPorTexto(search)
    if (ids.length === 0) {
      return { data: [], total: 0, page, pageSize }
    }
    query = query.in('ordem_servico_id', ids)
  }

  const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to)
  if (error) throw new Error(error.message)

  return {
    data: (data ?? []).map(mapLancamento),
    total: count ?? 0,
    page,
    pageSize,
  }
}

export async function buscarLancamentoDetalhe(caixaLancamentoId: string): Promise<CaixaLancamentoDetalhe> {
  const [lancamentoResp, recebimentosResp, historicoResp] = await Promise.all([
    supabase.from('caixa_lancamentos').select(SELECT_LANCAMENTO).eq('id', caixaLancamentoId).single(),
    supabase
      .from('caixa_recebimentos')
      .select('*, funcionarios(nome)')
      .eq('caixa_lancamento_id', caixaLancamentoId)
      .order('created_at', { ascending: false }),
    supabase
      .from('caixa_lancamento_historico')
      .select('*, funcionarios(nome)')
      .eq('caixa_lancamento_id', caixaLancamentoId)
      .order('created_at', { ascending: false }),
  ])

  if (lancamentoResp.error) throw new Error(lancamentoResp.error.message)
  if (recebimentosResp.error) throw new Error(recebimentosResp.error.message)
  if (historicoResp.error) throw new Error(historicoResp.error.message)

  return {
    lancamento: mapLancamento(lancamentoResp.data),
    recebimentos: (recebimentosResp.data ?? []).map(mapRecebimento),
    historico: (historicoResp.data ?? []).map(mapHistorico),
  }
}

export async function receberPagamento(
  caixaLancamentoId: string,
  funcionarioId: string,
  formas: FormaPagamentoInput[],
  desconto = 0,
): Promise<string> {
  const ip = await capturarIpPublico()
  const { data, error } = await supabase.rpc('caixa_receber', {
    p_caixa_lancamento_id: caixaLancamentoId,
    p_funcionario_id: funcionarioId,
    p_ip: ip,
    p_formas: formas,
    p_desconto: desconto,
  })
  if (error) throw new Error(traduzirErro(error.message))
  return data as string
}

export async function marcarPendente(
  caixaLancamentoId: string,
  funcionarioId: string,
  observacoes?: string,
): Promise<void> {
  const ip = await capturarIpPublico()
  const { error } = await supabase.rpc('caixa_marcar_pendente', {
    p_caixa_lancamento_id: caixaLancamentoId,
    p_funcionario_id: funcionarioId,
    p_ip: ip,
    p_observacoes: observacoes || null,
  })
  if (error) throw new Error(traduzirErro(error.message))
}

export async function cancelarRecebimento(
  caixaLancamentoId: string,
  funcionarioId: string,
  motivo: string,
): Promise<void> {
  const ip = await capturarIpPublico()
  const { error } = await supabase.rpc('caixa_cancelar_recebimento', {
    p_caixa_lancamento_id: caixaLancamentoId,
    p_funcionario_id: funcionarioId,
    p_ip: ip,
    p_motivo: motivo,
  })
  if (error) throw new Error(traduzirErro(error.message))
}

// Estima quanto da taxa da maquininha, nas vendas parceladas no crédito, foi
// bancado pela oficina em vez de repassado ao cliente:
// - até `parcelasSemJuros` (config global de parcelamento), o cliente nunca
//   paga juros — a taxa da maquininha nessas parcelas é 100% perda da oficina;
// - acima disso, só sobra perda se o que foi de fato cobrado do cliente
//   (juros_percentual daquela venda) ficar abaixo da taxa real da maquininha
//   (ex: vendedor esqueceu de repassar, ou repassou menos que o custo real).
// bandeira é texto livre (ver caixa_recebimento_formas.bandeira) — casa
// contra o catálogo de bandeiras por nome (case-insensitive), e cai no grupo
// "outros" quando não bate com nenhuma (bandeira em branco ou desconhecida).
function calcularPerdaParcelamento(
  formasCredito: Array<{ valor: number; parcelas: number | null; bandeira: string | null; jurosPercentual: number | null }>,
  taxas: Array<Pick<TaxaMaquininha, 'grupoTaxa' | 'parcelas' | 'taxaPercentual'>>,
  bandeiras: Array<{ nome: string; grupoTaxa: GrupoTaxaMaquininha }>,
  parcelasSemJuros: number,
): { perda: number; semTaxa: number } {
  const grupoPorBandeira = new Map(bandeiras.map((b) => [b.nome.trim().toLowerCase(), b.grupoTaxa]))
  const taxaPorChave = new Map(taxas.map((t) => [`${t.grupoTaxa}:${t.parcelas}`, t.taxaPercentual]))

  let perda = 0
  let semTaxa = 0

  for (const forma of formasCredito) {
    const parcelas = forma.parcelas || 1
    const grupo = grupoPorBandeira.get((forma.bandeira ?? '').trim().toLowerCase()) ?? 'outros'
    const taxaPercentual = taxaPorChave.get(`${grupo}:${parcelas}`)
    if (taxaPercentual === undefined) {
      semTaxa += 1
      continue
    }

    const custoMaquininha = (forma.valor * taxaPercentual) / 100
    if (parcelas <= parcelasSemJuros) {
      perda += custoMaquininha
    } else {
      const jurosRepassado = (forma.valor * (forma.jurosPercentual ?? 0)) / 100
      perda += Math.max(0, custoMaquininha - jurosRepassado)
    }
  }

  return { perda, semTaxa }
}

// Sem argumentos, é o resumo de hoje (comportamento original). Com
// dataInicio/dataFim (formato 'YYYY-MM-DD'), soma o período inteiro — mesmo
// padrão já usado no filtro "recebidas_periodo" de listarCaixaLancamentos:
// limitesDoDiaLocal calcula início/fim de UM dia no fuso local, então chama
// duas vezes (uma pro primeiro dia, outra pro último) pra montar o intervalo.
export async function buscarDashboardCaixa(dataInicio?: string, dataFim?: string): Promise<DashboardCaixa> {
  const { inicio } = limitesDoDiaLocal(dataInicio)
  const { fim } = limitesDoDiaLocal(dataFim ?? dataInicio)

  // Não busca custo/lucro aqui de propósito — o resumo do dia é visível pra
  // quem opera o caixa no dia a dia, e lucro só deve existir no momento do
  // fechamento (ver caixaSessaoService.buscarResumoSessao), então nem faz
  // sentido trazer esse dado pro cliente aqui. A perda com parcelamento é
  // exceção deliberada: não é lucro da venda, é custo operacional do meio de
  // pagamento, então cabe aqui pra quem opera o caixa já ver na hora.
  const [recebimentosResp, pendentesResp, taxasResp, bandeirasResp, parcelamentoResp] = await Promise.all([
    supabase
      .from('caixa_recebimentos')
      .select('id, valor_total, desconto, caixa_recebimento_formas(valor, forma_pagamento, parcelas, bandeira, juros_percentual)')
      .eq('cancelado', false)
      .gte('created_at', inicio)
      .lte('created_at', fim),
    supabase.from('caixa_lancamentos').select('id', { count: 'exact', head: true }).eq('status', 'pendente'),
    supabase.from('taxas_maquininha').select('grupo_taxa, tipo, parcelas, taxa_percentual').eq('tipo', 'credito'),
    supabase.from('bandeiras_cartao').select('nome, grupo_taxa'),
    supabase.from('configuracoes_parcelamento').select('parcelas_sem_juros').maybeSingle(),
  ])

  if (recebimentosResp.error) throw new Error(recebimentosResp.error.message)
  if (pendentesResp.error) throw new Error(pendentesResp.error.message)
  if (taxasResp.error) throw new Error(taxasResp.error.message)
  if (bandeirasResp.error) throw new Error(bandeirasResp.error.message)
  if (parcelamentoResp.error) throw new Error(parcelamentoResp.error.message)

  const recebimentos = recebimentosResp.data ?? []
  const formas = recebimentos.flatMap((r: any) => r.caixa_recebimento_formas ?? [])

  function somaPorForma(forma: string): number {
    return formas.filter((f: any) => f.forma_pagamento === forma).reduce((soma: number, f: any) => soma + Number(f.valor), 0)
  }

  const taxas = (taxasResp.data ?? []).map((t: any) => ({
    grupoTaxa: t.grupo_taxa as GrupoTaxaMaquininha,
    parcelas: Number(t.parcelas),
    taxaPercentual: Number(t.taxa_percentual ?? 0),
  }))
  const bandeiras = (bandeirasResp.data ?? []).map((b: any) => ({ nome: b.nome as string, grupoTaxa: b.grupo_taxa as GrupoTaxaMaquininha }))
  const parcelasSemJuros = Number(parcelamentoResp.data?.parcelas_sem_juros ?? 6)

  const formasCredito = formas
    .filter((f: any) => f.forma_pagamento === 'credito')
    .map((f: any) => ({
      valor: Number(f.valor),
      parcelas: f.parcelas === null ? null : Number(f.parcelas),
      bandeira: f.bandeira,
      jurosPercentual: f.juros_percentual === null ? null : Number(f.juros_percentual),
    }))
  const { perda: perdaParcelamentoCredito, semTaxa: vendasCreditoSemTaxaConfigurada } = calcularPerdaParcelamento(
    formasCredito,
    taxas,
    bandeiras,
    parcelasSemJuros,
  )

  return {
    recebidoHoje: recebimentos.reduce((soma: number, r: any) => soma + Number(r.valor_total), 0),
    recebidoPix: somaPorForma('pix'),
    recebidoDinheiro: somaPorForma('dinheiro'),
    recebidoDebito: somaPorForma('debito'),
    recebidoCredito: somaPorForma('credito'),
    recebidoBoleto: somaPorForma('boleto'),
    pendentes: pendentesResp.count ?? 0,
    quantidadeOs: recebimentos.length,
    totalGeral: recebimentos.reduce((soma: number, r: any) => soma + Number(r.valor_total), 0),
    descontosHoje: recebimentos.reduce((soma: number, r: any) => soma + Number(r.desconto ?? 0), 0),
    perdaParcelamentoCredito,
    vendasCreditoSemTaxaConfigurada,
  }
}

export async function listarHistoricoCaixa(params: ListarHistoricoCaixaParams = {}): Promise<ListarHistoricoCaixaResult> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 30
  const search = params.search?.trim() ?? ''

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('caixa_lancamento_historico')
    .select('*, funcionarios(nome), caixa_lancamentos(ordem_servico_id, ordens_servico(numero, clientes(nome)))', {
      count: 'exact',
    })

  if (search) {
    const idsOrdens = await buscarIdsOrdensPorTexto(search)
    if (idsOrdens.length === 0) return { data: [], total: 0, page, pageSize }

    const { data: lancamentosEncontrados, error: erroLancamentos } = await supabase
      .from('caixa_lancamentos')
      .select('id')
      .in('ordem_servico_id', idsOrdens)
    if (erroLancamentos) throw new Error(erroLancamentos.message)

    const ids = (lancamentosEncontrados ?? []).map((r) => r.id)
    if (ids.length === 0) return { data: [], total: 0, page, pageSize }
    query = query.in('caixa_lancamento_id', ids)
  }

  const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to)
  if (error) throw new Error(error.message)

  return {
    data: (data ?? []).map((row: any) => ({
      ...mapHistorico(row),
      ordemServicoId: row.caixa_lancamentos?.ordem_servico_id ?? null,
      ordemNumero: Number(row.caixa_lancamentos?.ordens_servico?.numero ?? 0),
      clienteNome: row.caixa_lancamentos?.ordens_servico?.clientes?.nome ?? null,
    })),
    total: count ?? 0,
    page,
    pageSize,
  }
}

// Usado pra achar o lançamento de Caixa de uma OS a partir da tela de Ordens
// (que só tem o ordemServicoId), pra abrir o modal de emissão de Nota Fiscal.
export async function buscarCaixaLancamentoIdPorOrdem(ordemServicoId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('caixa_lancamentos')
    .select('id')
    .eq('ordem_servico_id', ordemServicoId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data?.id ?? null
}

// Usado na impressão da OS pra mostrar como o cliente pagou (só existe
// depois que a OS foi recebida no caixa — antes disso volta lista vazia).
// Busca via ordem_servico_id direto (join aninhado) em vez de resolver o
// caixa_lancamento_id primeiro com .maybeSingle() — se a OS já foi reaberta
// e finalizada mais de uma vez existe mais de um caixa_lancamento pra ela, e
// .maybeSingle() quebraria com erro nesse caso.
export interface FormasPagamentoDaOrdem {
  formas: Array<{ formaPagamento: FormaPagamento; valor: number }>
  desconto: number
}

export async function buscarFormasPagamentoDaOrdem(ordemServicoId: string): Promise<FormasPagamentoDaOrdem> {
  const { data, error } = await supabase
    .from('caixa_recebimentos')
    .select('cancelado, desconto, caixa_recebimento_formas(forma_pagamento, valor), caixa_lancamentos!inner(ordem_servico_id)')
    .eq('caixa_lancamentos.ordem_servico_id', ordemServicoId)
    .eq('cancelado', false)
  if (error) throw new Error(error.message)

  const registros = data ?? []
  return {
    formas: registros.flatMap((r: any) => r.caixa_recebimento_formas ?? []).map((f: any) => ({
      formaPagamento: f.forma_pagamento as FormaPagamento,
      valor: Number(f.valor),
    })),
    desconto: registros.reduce((soma: number, r: any) => soma + Number(r.desconto ?? 0), 0),
  }
}
