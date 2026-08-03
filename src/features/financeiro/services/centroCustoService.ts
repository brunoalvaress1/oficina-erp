import { supabase } from '@/lib/supabase'
import type { CentroCusto } from '../types/centroCusto'

function mapRow(row: any): CentroCusto {
  return {
    id: row.id,
    oficinaId: row.oficina_id,
    nome: row.nome,
    ativo: row.ativo,
    createdAt: row.created_at,
  }
}

export async function listarCentrosCusto(): Promise<CentroCusto[]> {
  const { data, error } = await supabase.from('centros_custo').select('*').order('nome')
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapRow)
}

export async function buscarCentrosCusto(termo: string): Promise<CentroCusto[]> {
  let query = supabase.from('centros_custo').select('*').eq('ativo', true).order('nome').limit(20)
  if (termo.trim()) query = query.ilike('nome', `%${termo.trim().replace(/,/g, ' ')}%`)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapRow)
}

export async function criarCentroCusto(nome: string, oficinaId: string): Promise<CentroCusto> {
  const { data, error } = await supabase
    .from('centros_custo')
    .insert({ oficina_id: oficinaId, nome })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return mapRow(data)
}

export async function atualizarCentroCusto(id: string, alteracoes: { nome?: string; ativo?: boolean }): Promise<CentroCusto> {
  const { data, error } = await supabase.from('centros_custo').update(alteracoes).eq('id', id).select('*').single()
  if (error) throw new Error(error.message)
  return mapRow(data)
}

function traduzirErroExclusao(mensagem: string): string {
  if (mensagem.includes('foreign key') || mensagem.includes('violates foreign key constraint')) {
    return 'Esse centro de custo já está sendo usado em algum lançamento e não pode ser excluído. Desative ele em vez de excluir.'
  }
  return mensagem
}

export async function excluirCentroCusto(id: string): Promise<void> {
  const { error } = await supabase.from('centros_custo').delete().eq('id', id)
  if (error) throw new Error(traduzirErroExclusao(error.message))
}
