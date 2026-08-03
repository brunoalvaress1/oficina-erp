import { supabase } from '@/lib/supabase'
import type { Funcionario, Permissao } from '@/types/permissao'

export async function fetchFuncionarioAtual(userId: string): Promise<Funcionario | null> {
  const { data, error } = await supabase
    .from('funcionarios')
    .select('id, user_id, oficina_id, nome, cargo, ativo')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Erro ao buscar funcionario:', error.message)
    return null
  }

  return {
    id: data.id,
    userId: data.user_id,
    oficinaId: data.oficina_id,
    nome: data.nome,
    cargo: data.cargo,
    ativo: data.ativo,
  }
}

export async function fetchPermissoesDoFuncionario(funcionarioId: string): Promise<Permissao[]> {
  const { data, error } = await supabase
    .from('funcionario_permissoes')
    .select('permissoes (id, codigo, descricao, categoria)')
    .eq('funcionario_id', funcionarioId)

  if (error) {
    console.error('Erro ao buscar permissoes:', error.message)
    return []
  }

  return data.flatMap((row) => row.permissoes) as unknown as Permissao[]
}