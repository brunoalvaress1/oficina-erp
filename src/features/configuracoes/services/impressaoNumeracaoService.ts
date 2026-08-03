import { supabase } from '@/lib/supabase'
import { registrarAuditoriaConfiguracao } from './auditoriaConfigService'
import type { ConfiguracaoImpressao, ConfiguracaoNumeracao } from '../types/preferencias'

function mapImpressao(row: any): ConfiguracaoImpressao {
  return { oficinaId: row.oficina_id, tamanhoPapel: row.tamanho_papel, margemMm: row.margem_mm, impressoraPadrao: row.impressora_padrao }
}

export async function buscarConfiguracaoImpressao(oficinaId: string): Promise<ConfiguracaoImpressao | null> {
  const { data, error } = await supabase.from('configuracoes_impressao').select('*').eq('oficina_id', oficinaId).maybeSingle()
  if (error) throw new Error(error.message)
  return data ? mapImpressao(data) : null
}

export async function atualizarConfiguracaoImpressao(
  oficinaId: string,
  alteracoes: Partial<Omit<ConfiguracaoImpressao, 'oficinaId'>>,
  funcionarioId: string,
): Promise<ConfiguracaoImpressao> {
  const colunas: Record<string, any> = { oficina_id: oficinaId }
  if (alteracoes.tamanhoPapel !== undefined) colunas.tamanho_papel = alteracoes.tamanhoPapel
  if (alteracoes.margemMm !== undefined) colunas.margem_mm = alteracoes.margemMm
  if (alteracoes.impressoraPadrao !== undefined) colunas.impressora_padrao = alteracoes.impressoraPadrao || null

  const { data, error } = await supabase
    .from('configuracoes_impressao')
    .upsert(colunas, { onConflict: 'oficina_id' })
    .select('*')
    .single()
  if (error) throw new Error(error.message)

  await registrarAuditoriaConfiguracao('impressao', oficinaId, funcionarioId, 'atualizado', colunas)

  return mapImpressao(data)
}

function mapNumeracao(row: any): ConfiguracaoNumeracao {
  return { oficinaId: row.oficina_id, prefixoOs: row.prefixo_os, prefixoNf: row.prefixo_nf, paddingDigitos: row.padding_digitos }
}

export async function buscarConfiguracaoNumeracao(oficinaId: string): Promise<ConfiguracaoNumeracao | null> {
  const { data, error } = await supabase.from('configuracoes_numeracao').select('*').eq('oficina_id', oficinaId).maybeSingle()
  if (error) throw new Error(error.message)
  return data ? mapNumeracao(data) : null
}

export async function atualizarConfiguracaoNumeracao(
  oficinaId: string,
  alteracoes: Partial<Omit<ConfiguracaoNumeracao, 'oficinaId'>>,
  funcionarioId: string,
): Promise<ConfiguracaoNumeracao> {
  const colunas: Record<string, any> = { oficina_id: oficinaId }
  if (alteracoes.prefixoOs !== undefined) colunas.prefixo_os = alteracoes.prefixoOs || null
  if (alteracoes.prefixoNf !== undefined) colunas.prefixo_nf = alteracoes.prefixoNf || null
  if (alteracoes.paddingDigitos !== undefined) colunas.padding_digitos = alteracoes.paddingDigitos

  const { data, error } = await supabase
    .from('configuracoes_numeracao')
    .upsert(colunas, { onConflict: 'oficina_id' })
    .select('*')
    .single()
  if (error) throw new Error(error.message)

  await registrarAuditoriaConfiguracao('numeracao', oficinaId, funcionarioId, 'atualizado', colunas)

  return mapNumeracao(data)
}

export function formatarNumeroDocumento(prefixo: string | null | undefined, numero: number, padding = 6): string {
  const numeroFormatado = String(numero).padStart(padding, '0')
  return prefixo ? `${prefixo}${numeroFormatado}` : numeroFormatado
}
