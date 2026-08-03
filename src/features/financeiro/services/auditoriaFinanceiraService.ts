import { supabase } from '@/lib/supabase'
import type { HistoricoFinanceiroEntry, ListarHistoricoFinanceiroParams, ListarHistoricoFinanceiroResult } from '../types/auditoriaFinanceira'

function mapRow(row: any): HistoricoFinanceiroEntry {
  return {
    id: row.id,
    entidade: row.entidade,
    entidadeId: row.entidade_id,
    funcionarioId: row.funcionario_id,
    funcionarioNome: row.funcionarios?.nome ?? null,
    acao: row.acao,
    detalhes: row.detalhes,
    ip: row.ip,
    createdAt: row.created_at,
  }
}

export async function listarHistoricoFinanceiro(params: ListarHistoricoFinanceiroParams = {}): Promise<ListarHistoricoFinanceiroResult> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 30

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase.from('financeiro_historico').select('*, funcionarios(nome)', { count: 'exact' })

  if (params.entidade) query = query.eq('entidade', params.entidade)
  if (params.funcionarioId) query = query.eq('funcionario_id', params.funcionarioId)
  if (params.dataInicio) query = query.gte('created_at', params.dataInicio)
  if (params.dataFim) query = query.lte('created_at', params.dataFim)

  const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to)
  if (error) throw new Error(error.message)

  return {
    data: (data ?? []).map(mapRow),
    total: count ?? 0,
    page,
    pageSize,
  }
}
