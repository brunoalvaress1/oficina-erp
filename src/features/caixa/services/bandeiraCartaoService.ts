import { supabase } from '@/lib/supabase'
import type { BandeiraCartao } from '../types/bandeiraCartao'

function mapRow(row: any): BandeiraCartao {
  return {
    id: row.id,
    oficinaId: row.oficina_id,
    nome: row.nome,
    ativo: row.ativo,
    createdAt: row.created_at,
  }
}

export async function buscarBandeirasCartao(termo: string): Promise<BandeiraCartao[]> {
  let query = supabase.from('bandeiras_cartao').select('*').eq('ativo', true).order('nome').limit(20)

  if (termo.trim()) {
    query = query.ilike('nome', `%${termo.trim().replace(/,/g, ' ')}%`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapRow)
}

export async function criarBandeiraCartao(nome: string, oficinaId: string): Promise<BandeiraCartao> {
  const { data, error } = await supabase
    .from('bandeiras_cartao')
    .insert({ oficina_id: oficinaId, nome })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return mapRow(data)
}
