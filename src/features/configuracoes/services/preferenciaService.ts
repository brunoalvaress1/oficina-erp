import { supabase } from '@/lib/supabase'
import type { PreferenciaFuncionario } from '../types/preferencias'

function mapRow(row: any): PreferenciaFuncionario {
  return {
    funcionarioId: row.funcionario_id,
    tema: row.tema,
    itensPorPagina: row.itens_por_pagina ?? 20,
    telaInicial: row.tela_inicial,
    salvarFiltros: row.salvar_filtros,
  }
}

export async function buscarPreferencias(funcionarioId: string): Promise<PreferenciaFuncionario | null> {
  const { data, error } = await supabase.from('preferencias_funcionario').select('*').eq('funcionario_id', funcionarioId).maybeSingle()
  if (error) throw new Error(error.message)
  return data ? mapRow(data) : null
}

export async function salvarPreferencias(
  funcionarioId: string,
  alteracoes: Partial<Omit<PreferenciaFuncionario, 'funcionarioId'>>,
): Promise<PreferenciaFuncionario> {
  const colunas: Record<string, any> = { funcionario_id: funcionarioId }
  if (alteracoes.tema !== undefined) colunas.tema = alteracoes.tema
  if (alteracoes.itensPorPagina !== undefined) colunas.itens_por_pagina = alteracoes.itensPorPagina
  if (alteracoes.telaInicial !== undefined) colunas.tela_inicial = alteracoes.telaInicial
  if (alteracoes.salvarFiltros !== undefined) colunas.salvar_filtros = alteracoes.salvarFiltros

  const { data, error } = await supabase
    .from('preferencias_funcionario')
    .upsert(colunas, { onConflict: 'funcionario_id' })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return mapRow(data)
}
