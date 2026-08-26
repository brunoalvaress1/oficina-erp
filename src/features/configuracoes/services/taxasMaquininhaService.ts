import { supabase } from '@/lib/supabase'
import { registrarAuditoriaConfiguracao } from './auditoriaConfigService'
import type { TaxaMaquininha } from '../types/pagamentos'

function mapRow(row: any): TaxaMaquininha {
  return {
    id: row.id,
    oficinaId: row.oficina_id,
    grupoTaxa: row.grupo_taxa,
    tipo: row.tipo,
    parcelas: Number(row.parcelas),
    taxaPercentual: Number(row.taxa_percentual ?? 0),
  }
}

export async function listarTaxasMaquininha(oficinaId: string): Promise<TaxaMaquininha[]> {
  const { data, error } = await supabase
    .from('taxas_maquininha')
    .select('*')
    .eq('oficina_id', oficinaId)
    .order('grupo_taxa')
    .order('tipo')
    .order('parcelas')
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapRow)
}

export async function atualizarTaxaMaquininha(id: string, taxaPercentual: number, funcionarioId: string): Promise<TaxaMaquininha> {
  const { data, error } = await supabase
    .from('taxas_maquininha')
    .update({ taxa_percentual: taxaPercentual, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new Error(error.message)

  await registrarAuditoriaConfiguracao('taxa_maquininha', id, funcionarioId, 'atualizado', { taxaPercentual })

  return mapRow(data)
}
