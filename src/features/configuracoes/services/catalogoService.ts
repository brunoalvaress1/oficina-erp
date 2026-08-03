import { supabase } from '@/lib/supabase'
import { registrarAuditoriaConfiguracao } from './auditoriaConfigService'
import type { ItemCatalogo, TabelaCatalogo } from '../types/catalogos'

function mapRow(row: any): ItemCatalogo {
  return { id: row.id, oficinaId: row.oficina_id, nome: row.nome, ativo: row.ativo, createdAt: row.created_at }
}

export async function listarItensCatalogo(tabela: TabelaCatalogo, oficinaId: string): Promise<ItemCatalogo[]> {
  const { data, error } = await supabase.from(tabela).select('*').eq('oficina_id', oficinaId).order('nome')
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapRow)
}

export async function criarItemCatalogo(tabela: TabelaCatalogo, nome: string, oficinaId: string, funcionarioId: string): Promise<ItemCatalogo> {
  const { data, error } = await supabase.from(tabela).insert({ oficina_id: oficinaId, nome }).select('*').single()
  if (error) throw new Error(error.message)

  await registrarAuditoriaConfiguracao(tabela, data.id, funcionarioId, 'criado', { nome })

  return mapRow(data)
}

export async function atualizarItemCatalogo(
  tabela: TabelaCatalogo,
  id: string,
  alteracoes: { nome?: string; ativo?: boolean },
  funcionarioId: string,
): Promise<ItemCatalogo> {
  const { data, error } = await supabase.from(tabela).update(alteracoes).eq('id', id).select('*').single()
  if (error) throw new Error(error.message)

  await registrarAuditoriaConfiguracao(tabela, id, funcionarioId, 'atualizado', alteracoes)

  return mapRow(data)
}

function traduzirErroExclusao(mensagem: string): string {
  if (mensagem.includes('foreign key') || mensagem.includes('violates foreign key constraint')) {
    return 'Esse item já está em uso e não pode ser excluído. Desative em vez de excluir.'
  }
  return mensagem
}

export async function excluirItemCatalogo(tabela: TabelaCatalogo, id: string, funcionarioId: string): Promise<void> {
  const { error } = await supabase.from(tabela).delete().eq('id', id)
  if (error) throw new Error(traduzirErroExclusao(error.message))

  await registrarAuditoriaConfiguracao(tabela, id, funcionarioId, 'excluido')
}
