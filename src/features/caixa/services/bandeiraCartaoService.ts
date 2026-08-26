import { supabase } from '@/lib/supabase'
import type { BandeiraCartao, GrupoTaxaMaquininha } from '../types/bandeiraCartao'

function mapRow(row: any): BandeiraCartao {
  return {
    id: row.id,
    oficinaId: row.oficina_id,
    nome: row.nome,
    grupoTaxa: row.grupo_taxa ?? 'outros',
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

// Todas as bandeiras (ativas ou não) da oficina — usado na tela de
// Configurações pra marcar qual grupo de taxa (Mastercard/Outros) cada uma
// usa no cálculo de perda com parcelamento.
export async function listarBandeirasCartaoCompleto(oficinaId: string): Promise<BandeiraCartao[]> {
  const { data, error } = await supabase.from('bandeiras_cartao').select('*').eq('oficina_id', oficinaId).order('nome')
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapRow)
}

export async function atualizarGrupoTaxaBandeira(id: string, grupoTaxa: GrupoTaxaMaquininha): Promise<BandeiraCartao> {
  const { data, error } = await supabase.from('bandeiras_cartao').update({ grupo_taxa: grupoTaxa }).eq('id', id).select('*').single()
  if (error) throw new Error(error.message)
  return mapRow(data)
}
