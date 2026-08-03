import { supabase } from '@/lib/supabase'
import { registrarAuditoriaConfiguracao } from './auditoriaConfigService'
import type { ChangelogEntry } from '../types/operacional'

function mapRow(row: any): ChangelogEntry {
  return { id: row.id, oficinaId: row.oficina_id, versao: row.versao, data: row.data, descricao: row.descricao, createdAt: row.created_at }
}

export async function listarChangelog(oficinaId: string): Promise<ChangelogEntry[]> {
  const { data, error } = await supabase.from('changelog_entries').select('*').eq('oficina_id', oficinaId).order('data', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapRow)
}

export async function criarEntradaChangelog(
  oficinaId: string,
  versao: string,
  descricao: string,
  funcionarioId: string,
): Promise<ChangelogEntry> {
  const { data, error } = await supabase
    .from('changelog_entries')
    .insert({ oficina_id: oficinaId, versao, descricao })
    .select('*')
    .single()
  if (error) throw new Error(error.message)

  await registrarAuditoriaConfiguracao('changelog', data.id, funcionarioId, 'criado', { versao })

  return mapRow(data)
}
