import { supabase } from '@/lib/supabase'
import { registrarAuditoriaConfiguracao } from './auditoriaConfigService'
import type { PerfilPermissao, PerfilPermissaoInput } from '../types/permissaoPerfil'

function mapRow(row: any): PerfilPermissao {
  return {
    id: row.id,
    oficinaId: row.oficina_id,
    nome: row.nome,
    codigos: row.codigos ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listarPerfis(oficinaId: string): Promise<PerfilPermissao[]> {
  const { data, error } = await supabase.from('perfis_permissao').select('*').eq('oficina_id', oficinaId).order('nome')
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapRow)
}

export async function criarPerfil(input: PerfilPermissaoInput, oficinaId: string, funcionarioId: string): Promise<PerfilPermissao> {
  const { data, error } = await supabase
    .from('perfis_permissao')
    .insert({ oficina_id: oficinaId, nome: input.nome, codigos: input.codigos })
    .select('*')
    .single()
  if (error) throw new Error(error.message)

  await registrarAuditoriaConfiguracao('perfil_permissao', data.id, funcionarioId, 'criado', { nome: input.nome, codigos: input.codigos })

  return mapRow(data)
}

export async function atualizarPerfil(id: string, input: PerfilPermissaoInput, funcionarioId: string): Promise<PerfilPermissao> {
  const { data, error } = await supabase
    .from('perfis_permissao')
    .update({ nome: input.nome, codigos: input.codigos, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new Error(error.message)

  await registrarAuditoriaConfiguracao('perfil_permissao', id, funcionarioId, 'atualizado', { nome: input.nome, codigos: input.codigos })

  return mapRow(data)
}

export async function excluirPerfil(id: string, funcionarioId: string): Promise<void> {
  const { error } = await supabase.from('perfis_permissao').delete().eq('id', id)
  if (error) throw new Error(error.message)

  await registrarAuditoriaConfiguracao('perfil_permissao', id, funcionarioId, 'excluido')
}
