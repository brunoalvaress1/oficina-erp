import { supabase } from '@/lib/supabase'
import type { LucroPeca, LucroServico } from '../types/relatorioLucro'

export async function buscarLucroPecas(oficinaId: string, dataInicio: string, dataFim: string): Promise<LucroPeca[]> {
  const { data, error } = await supabase.rpc('relatorio_lucro_pecas', {
    p_oficina_id: oficinaId,
    p_data_inicio: dataInicio,
    p_data_fim: dataFim,
  })
  if (error) throw new Error(error.message)
  return (data ?? []).map((row: any) => ({
    produtoId: row.produto_id,
    descricao: row.descricao,
    tipo: row.tipo,
    quantidade: Number(row.quantidade ?? 0),
    valorVendido: Number(row.valor_vendido ?? 0),
    custoTotal: Number(row.custo_total ?? 0),
    lucro: Number(row.lucro ?? 0),
    margemPercentual: Number(row.margem_percentual ?? 0),
  }))
}

export async function buscarLucroServicos(oficinaId: string, dataInicio: string, dataFim: string): Promise<LucroServico[]> {
  const { data, error } = await supabase.rpc('relatorio_lucro_servicos', {
    p_oficina_id: oficinaId,
    p_data_inicio: dataInicio,
    p_data_fim: dataFim,
  })
  if (error) throw new Error(error.message)
  return (data ?? []).map((row: any) => ({
    servicoId: row.servico_id,
    descricao: row.descricao,
    quantidade: Number(row.quantidade ?? 0),
    valorVendido: Number(row.valor_vendido ?? 0),
    lucro: Number(row.lucro ?? 0),
  }))
}
