import { supabase } from '@/lib/supabase'
import { registrarAuditoriaConfiguracao } from './auditoriaConfigService'
import type { Integracao } from '../types/operacional'

function mapRow(row: any): Integracao {
  return {
    id: row.id,
    oficinaId: row.oficina_id,
    codigo: row.codigo,
    nome: row.nome,
    status: row.status,
    token: row.token,
    apiKey: row.api_key,
    config: row.config,
    updatedAt: row.updated_at,
  }
}

export async function listarIntegracoes(oficinaId: string): Promise<Integracao[]> {
  const { data, error } = await supabase.from('integracoes').select('*').eq('oficina_id', oficinaId).order('nome')
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapRow)
}

export async function atualizarIntegracao(
  id: string,
  alteracoes: { status?: boolean; token?: string | null; apiKey?: string | null; config?: Record<string, unknown> },
  funcionarioId: string,
): Promise<Integracao> {
  const colunas: Record<string, any> = { updated_at: new Date().toISOString() }
  if (alteracoes.status !== undefined) colunas.status = alteracoes.status
  if (alteracoes.token !== undefined) colunas.token = alteracoes.token || null
  if (alteracoes.apiKey !== undefined) colunas.api_key = alteracoes.apiKey || null
  if (alteracoes.config !== undefined) colunas.config = alteracoes.config

  const { data, error } = await supabase.from('integracoes').update(colunas).eq('id', id).select('*').single()
  if (error) throw new Error(error.message)

  await registrarAuditoriaConfiguracao('integracao', id, funcionarioId, 'atualizado', { status: alteracoes.status })

  return mapRow(data)
}
