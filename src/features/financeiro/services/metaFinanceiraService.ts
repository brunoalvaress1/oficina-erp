import { supabase } from '@/lib/supabase'
import { capturarIpPublico } from '@/utils/capturarIp'
import type { MetaFinanceira } from '../types/metaFinanceira'

export async function buscarMetaDoMes(oficinaId: string, ano: number, mes: number): Promise<MetaFinanceira | null> {
  const { data, error } = await supabase
    .from('financeiro_metas')
    .select('*')
    .eq('oficina_id', oficinaId)
    .eq('ano', ano)
    .eq('mes', mes)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null
  return { id: data.id, oficinaId: data.oficina_id, ano: data.ano, mes: data.mes, valorMeta: Number(data.valor_meta ?? 0) }
}

export async function definirMetaDoMes(
  oficinaId: string,
  ano: number,
  mes: number,
  valorMeta: number,
  funcionarioId: string,
): Promise<void> {
  const ip = await capturarIpPublico()
  const { error } = await supabase.rpc('financeiro_definir_meta', {
    p_oficina_id: oficinaId,
    p_ano: ano,
    p_mes: mes,
    p_valor_meta: valorMeta,
    p_funcionario_id: funcionarioId,
    p_ip: ip,
  })
  if (error) throw new Error(error.message)
}
