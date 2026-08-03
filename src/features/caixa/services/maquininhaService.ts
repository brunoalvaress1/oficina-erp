import { supabase } from '@/lib/supabase'
import type { Maquininha } from '../types/maquininha'

function mapRow(row: any): Maquininha {
  return {
    id: row.id,
    oficinaId: row.oficina_id,
    nome: row.nome,
    ativo: row.ativo,
    createdAt: row.created_at,
  }
}

export async function buscarMaquininhas(termo: string): Promise<Maquininha[]> {
  let query = supabase.from('maquininhas').select('*').eq('ativo', true).order('nome').limit(20)

  if (termo.trim()) {
    query = query.ilike('nome', `%${termo.trim().replace(/,/g, ' ')}%`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapRow)
}

export async function criarMaquininha(nome: string, oficinaId: string): Promise<Maquininha> {
  const { data, error } = await supabase
    .from('maquininhas')
    .insert({ oficina_id: oficinaId, nome })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return mapRow(data)
}
