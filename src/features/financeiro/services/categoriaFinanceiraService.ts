import { supabase } from '@/lib/supabase'
import type { CategoriaFinanceira, TipoCategoriaFinanceira } from '../types/categoriaFinanceira'

function mapRow(row: any): CategoriaFinanceira {
  return {
    id: row.id,
    oficinaId: row.oficina_id,
    nome: row.nome,
    tipo: row.tipo,
    ativo: row.ativo,
    createdAt: row.created_at,
  }
}

export async function listarCategoriasFinanceiras(): Promise<CategoriaFinanceira[]> {
  const { data, error } = await supabase.from('categorias_financeiras').select('*').order('nome')
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapRow)
}

export async function buscarCategoriasFinanceiras(termo: string): Promise<CategoriaFinanceira[]> {
  let query = supabase.from('categorias_financeiras').select('*').eq('ativo', true).order('nome').limit(20)
  if (termo.trim()) query = query.ilike('nome', `%${termo.trim().replace(/,/g, ' ')}%`)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapRow)
}

export async function criarCategoriaFinanceira(
  nome: string,
  oficinaId: string,
  tipo: TipoCategoriaFinanceira = 'ambos',
): Promise<CategoriaFinanceira> {
  const { data, error } = await supabase
    .from('categorias_financeiras')
    .insert({ oficina_id: oficinaId, nome, tipo })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return mapRow(data)
}

export async function atualizarCategoriaFinanceira(
  id: string,
  alteracoes: { nome?: string; tipo?: TipoCategoriaFinanceira; ativo?: boolean },
): Promise<CategoriaFinanceira> {
  const { data, error } = await supabase
    .from('categorias_financeiras')
    .update(alteracoes)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return mapRow(data)
}

function traduzirErroExclusao(mensagem: string): string {
  if (mensagem.includes('foreign key') || mensagem.includes('violates foreign key constraint')) {
    return 'Essa categoria já está sendo usada em algum lançamento e não pode ser excluída. Desative ela em vez de excluir.'
  }
  return mensagem
}

export async function excluirCategoriaFinanceira(id: string): Promise<void> {
  const { error } = await supabase.from('categorias_financeiras').delete().eq('id', id)
  if (error) throw new Error(traduzirErroExclusao(error.message))
}
