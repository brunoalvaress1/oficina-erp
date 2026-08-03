import { supabase } from '@/lib/supabase'
import type { PecaTerceirizada } from '../types/pecaTerceirizada'

function mapRow(row: any): PecaTerceirizada {
  return {
    id: row.id,
    oficinaId: row.oficina_id,
    nome: row.nome,
    createdAt: row.created_at,
  }
}

export async function buscarPecasTerceirizadas(termo: string): Promise<PecaTerceirizada[]> {
  const texto = termo.trim()

  let query = supabase.from('pecas_terceirizadas_catalogo').select('*').order('nome').limit(20)

  if (texto) {
    query = query.ilike('nome', `%${texto.replace(/,/g, ' ')}%`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapRow)
}

export async function criarPecaTerceirizada(nome: string, oficinaId: string): Promise<PecaTerceirizada> {
  const { data, error } = await supabase
    .from('pecas_terceirizadas_catalogo')
    .insert({ oficina_id: oficinaId, nome })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return mapRow(data)
}

// Registra o nome no catálogo se ainda não existir (silencioso — não bloqueia o
// fluxo de adicionar item se falhar, é só pra ajudar na próxima busca).
export async function garantirPecaNoCatalogo(nome: string, oficinaId: string): Promise<void> {
  const nomeLimpo = nome.trim()
  if (!nomeLimpo) return

  const { data } = await supabase
    .from('pecas_terceirizadas_catalogo')
    .select('id')
    .ilike('nome', nomeLimpo)
    .maybeSingle()

  if (data) return

  await supabase.from('pecas_terceirizadas_catalogo').insert({ oficina_id: oficinaId, nome: nomeLimpo })
}
