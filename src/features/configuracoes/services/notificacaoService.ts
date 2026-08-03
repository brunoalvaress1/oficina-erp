import { supabase } from '@/lib/supabase'
import { registrarAuditoriaConfiguracao } from './auditoriaConfigService'
import type { NotificacaoConfig } from '../types/operacional'

function mapRow(row: any): NotificacaoConfig {
  return { id: row.id, oficinaId: row.oficina_id, tipo: row.tipo, ativo: row.ativo }
}

export async function listarNotificacoesConfig(oficinaId: string): Promise<NotificacaoConfig[]> {
  const { data, error } = await supabase.from('notificacoes_config').select('*').eq('oficina_id', oficinaId)
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapRow)
}

export async function alternarNotificacaoConfig(id: string, ativo: boolean, funcionarioId: string): Promise<NotificacaoConfig> {
  const { data, error } = await supabase.from('notificacoes_config').update({ ativo }).eq('id', id).select('*').single()
  if (error) throw new Error(error.message)

  await registrarAuditoriaConfiguracao('notificacao', id, funcionarioId, ativo ? 'ativado' : 'desativado')

  return mapRow(data)
}
