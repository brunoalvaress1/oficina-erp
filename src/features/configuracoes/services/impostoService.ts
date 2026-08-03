import { supabase } from '@/lib/supabase'
import { registrarAuditoriaConfiguracao } from './auditoriaConfigService'
import type { Imposto, ImpostoInput } from '../types/catalogos'

function mapRow(row: any): Imposto {
  return {
    id: row.id,
    oficinaId: row.oficina_id,
    nome: row.nome,
    ncm: row.ncm,
    cest: row.cest,
    cfop: row.cfop,
    icmsPercentual: row.icms_percentual != null ? Number(row.icms_percentual) : null,
    ipiPercentual: row.ipi_percentual != null ? Number(row.ipi_percentual) : null,
    pisPercentual: row.pis_percentual != null ? Number(row.pis_percentual) : null,
    cofinsPercentual: row.cofins_percentual != null ? Number(row.cofins_percentual) : null,
    stPercentual: row.st_percentual != null ? Number(row.st_percentual) : null,
    classeFiscal: row.classe_fiscal,
    origem: row.origem,
    ativo: row.ativo,
    createdAt: row.created_at,
  }
}

export async function listarImpostos(oficinaId: string): Promise<Imposto[]> {
  const { data, error } = await supabase.from('impostos').select('*').eq('oficina_id', oficinaId).order('nome')
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapRow)
}

function paraColunas(input: Partial<ImpostoInput>) {
  return {
    nome: input.nome,
    ncm: input.ncm || null,
    cest: input.cest || null,
    cfop: input.cfop || null,
    icms_percentual: input.icmsPercentual ?? null,
    ipi_percentual: input.ipiPercentual ?? null,
    pis_percentual: input.pisPercentual ?? null,
    cofins_percentual: input.cofinsPercentual ?? null,
    st_percentual: input.stPercentual ?? null,
    classe_fiscal: input.classeFiscal || null,
    origem: input.origem || null,
    ativo: input.ativo ?? true,
  }
}

export async function criarImposto(input: ImpostoInput, oficinaId: string, funcionarioId: string): Promise<Imposto> {
  const { data, error } = await supabase
    .from('impostos')
    .insert({ oficina_id: oficinaId, ...paraColunas(input) })
    .select('*')
    .single()
  if (error) throw new Error(error.message)

  await registrarAuditoriaConfiguracao('imposto', data.id, funcionarioId, 'criado', { nome: input.nome })

  return mapRow(data)
}

export async function atualizarImposto(id: string, input: Partial<ImpostoInput>, funcionarioId: string): Promise<Imposto> {
  const { data, error } = await supabase.from('impostos').update(paraColunas(input)).eq('id', id).select('*').single()
  if (error) throw new Error(error.message)

  await registrarAuditoriaConfiguracao('imposto', id, funcionarioId, 'atualizado', { nome: input.nome })

  return mapRow(data)
}

export async function excluirImposto(id: string, funcionarioId: string): Promise<void> {
  const { error } = await supabase.from('impostos').delete().eq('id', id)
  if (error) throw new Error(error.message.includes('foreign key') ? 'Esse imposto está vinculado a produtos e não pode ser excluído.' : error.message)

  await registrarAuditoriaConfiguracao('imposto', id, funcionarioId, 'excluido')
}
