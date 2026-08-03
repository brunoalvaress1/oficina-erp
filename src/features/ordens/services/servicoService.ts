import { supabase } from '@/lib/supabase'
import type { Servico, ServicoInput } from '../types/servico'

function mapRow(row: any): Servico {
  return {
    id: row.id,
    oficinaId: row.oficina_id,
    nome: row.nome,
    valorPadrao: Number(row.valor_padrao ?? 0),
    categoriaId: row.categoria_id,
    categoriaNome: row.categorias_servicos?.nome ?? null,
    tempoMedioMinutos: row.tempo_medio_minutos,
    descricao: row.descricao,
    ativo: row.ativo,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function buscarServicos(termo: string): Promise<Servico[]> {
  const texto = termo.trim()

  let query = supabase.from('servicos').select('*').eq('ativo', true).order('nome').limit(20)

  if (texto) {
    query = query.ilike('nome', `%${texto.replace(/,/g, ' ')}%`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapRow)
}

export async function listarServicosCompleto(oficinaId: string): Promise<Servico[]> {
  const { data, error } = await supabase
    .from('servicos')
    .select('*, categorias_servicos(nome)')
    .eq('oficina_id', oficinaId)
    .order('nome')
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapRow)
}

export async function criarServico(input: ServicoInput, oficinaId: string): Promise<Servico> {
  const { data, error } = await supabase
    .from('servicos')
    .insert({
      oficina_id: oficinaId,
      nome: input.nome,
      valor_padrao: input.valorPadrao ?? 0,
      categoria_id: input.categoriaId || null,
      tempo_medio_minutos: input.tempoMedioMinutos || null,
      descricao: input.descricao || null,
    })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return mapRow(data)
}

export async function atualizarServico(id: string, input: Partial<ServicoInput>): Promise<Servico> {
  const colunas: Record<string, any> = {}
  if (input.nome !== undefined) colunas.nome = input.nome
  if (input.valorPadrao !== undefined) colunas.valor_padrao = input.valorPadrao
  if (input.categoriaId !== undefined) colunas.categoria_id = input.categoriaId || null
  if (input.tempoMedioMinutos !== undefined) colunas.tempo_medio_minutos = input.tempoMedioMinutos || null
  if (input.descricao !== undefined) colunas.descricao = input.descricao || null
  if (input.ativo !== undefined) colunas.ativo = input.ativo

  const { data, error } = await supabase.from('servicos').update(colunas).eq('id', id).select('*, categorias_servicos(nome)').single()
  if (error) throw new Error(error.message)
  return mapRow(data)
}
