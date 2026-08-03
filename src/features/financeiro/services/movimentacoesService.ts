import { supabase } from '@/lib/supabase'
import { capturarIpPublico } from '@/utils/capturarIp'
import type { ListarMovimentacoesParams, ListarMovimentacoesResult, MovimentacaoFinanceira } from '../types/movimentacaoFinanceira'

const SELECT_MOVIMENTACAO = `
  *,
  contas_bancarias (nome),
  categorias_financeiras (nome),
  centros_custo (nome),
  responsavel:funcionarios!movimentacoes_financeiras_responsavel_id_fkey (nome)
`

function mapRow(row: any): MovimentacaoFinanceira {
  return {
    id: row.id,
    oficinaId: row.oficina_id,
    dataMovimentacao: row.data_movimentacao,
    descricao: row.descricao,
    tipo: row.tipo,
    origem: row.origem,
    contaBancariaId: row.conta_bancaria_id,
    contaBancariaNome: row.contas_bancarias?.nome ?? null,
    formaPagamento: row.forma_pagamento,
    valorBruto: Number(row.valor_bruto ?? 0),
    taxa: Number(row.taxa ?? 0),
    valorLiquido: Number(row.valor_liquido ?? 0),
    categoriaId: row.categoria_id,
    categoriaNome: row.categorias_financeiras?.nome ?? null,
    centroCustoId: row.centro_custo_id,
    centroCustoNome: row.centros_custo?.nome ?? null,
    responsavelId: row.responsavel_id,
    responsavelNome: row.responsavel?.nome ?? null,
    referenciaTipo: row.referencia_tipo,
    referenciaId: row.referencia_id,
    conciliado: row.conciliado,
    valorConciliado: row.valor_conciliado != null ? Number(row.valor_conciliado) : null,
    conciliadoEm: row.conciliado_em,
    createdAt: row.created_at,
  }
}

function traduzirErro(mensagem: string): string {
  if (mensagem.includes('MOVIMENTACAO_NAO_ENCONTRADA')) return 'Movimentação não encontrada.'
  return mensagem
}

export async function listarMovimentacoes(
  oficinaId: string,
  params: ListarMovimentacoesParams = {},
): Promise<ListarMovimentacoesResult> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 30
  const search = params.search?.trim() ?? ''

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase.from('movimentacoes_financeiras').select(SELECT_MOVIMENTACAO, { count: 'exact' }).eq('oficina_id', oficinaId)

  if (params.dataInicio) query = query.gte('data_movimentacao', params.dataInicio)
  if (params.dataFim) query = query.lte('data_movimentacao', params.dataFim)
  if (params.tipo) query = query.eq('tipo', params.tipo)
  if (params.origem) query = query.eq('origem', params.origem)
  if (params.contaBancariaId) query = query.eq('conta_bancaria_id', params.contaBancariaId)
  if (params.formaPagamento) query = query.eq('forma_pagamento', params.formaPagamento)
  if (params.categoriaId) query = query.eq('categoria_id', params.categoriaId)
  if (params.centroCustoId) query = query.eq('centro_custo_id', params.centroCustoId)
  if (params.responsavelId) query = query.eq('responsavel_id', params.responsavelId)
  if (params.apenasComRegistroDivergencia) query = query.eq('tipo', 'entrada').not('valor_conciliado', 'is', null)
  if (search) query = query.ilike('descricao', `%${search.replace(/,/g, ' ')}%`)

  const { data, count, error } = await query.order('data_movimentacao', { ascending: false }).order('created_at', { ascending: false }).range(from, to)
  if (error) throw new Error(error.message)

  return {
    data: (data ?? []).map(mapRow),
    total: count ?? 0,
    page,
    pageSize,
  }
}

export async function conciliarMovimentacao(
  movimentacaoId: string,
  funcionarioId: string,
  valorConciliado: number,
  motivoDivergencia?: string,
): Promise<void> {
  const ip = await capturarIpPublico()
  const { error } = await supabase.rpc('financeiro_conciliar_movimentacao', {
    p_movimentacao_id: movimentacaoId,
    p_funcionario_id: funcionarioId,
    p_ip: ip,
    p_valor_conciliado: valorConciliado,
    p_motivo_divergencia: motivoDivergencia || null,
  })
  if (error) throw new Error(traduzirErro(error.message))
}
