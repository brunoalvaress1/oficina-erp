import { supabase } from '@/lib/supabase'
import { registrarAuditoriaConfiguracao } from './auditoriaConfigService'
import type { BackupEntry } from '../types/operacional'

function mapRow(row: any): BackupEntry {
  return {
    id: row.id,
    oficinaId: row.oficina_id,
    funcionarioId: row.funcionario_id,
    funcionarioNome: row.funcionarios?.nome ?? null,
    tamanhoEstimado: row.tamanho_estimado,
    status: row.status,
    observacoes: row.observacoes,
    createdAt: row.created_at,
  }
}

export async function listarBackups(oficinaId: string): Promise<BackupEntry[]> {
  const { data, error } = await supabase
    .from('backups_historico')
    .select('*, funcionarios(nome)')
    .eq('oficina_id', oficinaId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapRow)
}

export async function registrarBackupManual(oficinaId: string, funcionarioId: string, observacoes?: string): Promise<BackupEntry> {
  const { data, error } = await supabase
    .from('backups_historico')
    .insert({ oficina_id: oficinaId, funcionario_id: funcionarioId, status: 'concluido', observacoes: observacoes || null })
    .select('*, funcionarios(nome)')
    .single()
  if (error) throw new Error(error.message)

  await registrarAuditoriaConfiguracao('backup', data.id, funcionarioId, 'registrado')

  return mapRow(data)
}
