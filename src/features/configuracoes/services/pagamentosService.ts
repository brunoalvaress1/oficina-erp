import { supabase } from '@/lib/supabase'
import { registrarAuditoriaConfiguracao } from './auditoriaConfigService'
import type { ConfiguracaoParcelamento, FormaPagamentoConfig, FormaPagamentoConfigInput } from '../types/pagamentos'

function mapForma(row: any): FormaPagamentoConfig {
  return {
    codigo: row.codigo,
    oficinaId: row.oficina_id,
    nomeExibicao: row.nome_exibicao,
    icone: row.icone,
    cor: row.cor,
    taxaPercentual: Number(row.taxa_percentual ?? 0),
    prazoRecebimentoDias: Number(row.prazo_recebimento_dias ?? 0),
    contaBancariaPadraoId: row.conta_bancaria_padrao_id,
    contaBancariaPadraoNome: row.contas_bancarias?.nome ?? null,
    ativo: row.ativo,
  }
}

export async function listarFormasPagamentoConfig(oficinaId: string): Promise<FormaPagamentoConfig[]> {
  const { data, error } = await supabase
    .from('formas_pagamento_config')
    .select('*, contas_bancarias(nome)')
    .eq('oficina_id', oficinaId)
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapForma)
}

export async function atualizarFormaPagamentoConfig(
  codigo: string,
  input: FormaPagamentoConfigInput,
  funcionarioId: string,
): Promise<FormaPagamentoConfig> {
  const colunas: Record<string, any> = {}
  if (input.nomeExibicao !== undefined) colunas.nome_exibicao = input.nomeExibicao || null
  if (input.icone !== undefined) colunas.icone = input.icone || null
  if (input.cor !== undefined) colunas.cor = input.cor || null
  if (input.taxaPercentual !== undefined) colunas.taxa_percentual = input.taxaPercentual
  if (input.prazoRecebimentoDias !== undefined) colunas.prazo_recebimento_dias = input.prazoRecebimentoDias
  if (input.contaBancariaPadraoId !== undefined) colunas.conta_bancaria_padrao_id = input.contaBancariaPadraoId
  if (input.ativo !== undefined) colunas.ativo = input.ativo

  const { data, error } = await supabase
    .from('formas_pagamento_config')
    .update(colunas)
    .eq('codigo', codigo)
    .select('*, contas_bancarias(nome)')
    .single()
  if (error) throw new Error(error.message)

  await registrarAuditoriaConfiguracao('forma_pagamento', codigo, funcionarioId, 'atualizado', colunas)

  return mapForma(data)
}

function mapParcelamento(row: any): ConfiguracaoParcelamento {
  return {
    id: row.id,
    oficinaId: row.oficina_id,
    parcelasSemJuros: Number(row.parcelas_sem_juros ?? 6),
    jurosPercentual: Number(row.juros_percentual ?? 8),
  }
}

export async function buscarConfiguracaoParcelamento(oficinaId: string): Promise<ConfiguracaoParcelamento | null> {
  const { data, error } = await supabase.from('configuracoes_parcelamento').select('*').eq('oficina_id', oficinaId).maybeSingle()
  if (error) throw new Error(error.message)
  return data ? mapParcelamento(data) : null
}

export async function atualizarConfiguracaoParcelamento(
  oficinaId: string,
  parcelasSemJuros: number,
  jurosPercentual: number,
  funcionarioId: string,
): Promise<ConfiguracaoParcelamento> {
  const { data, error } = await supabase
    .from('configuracoes_parcelamento')
    .upsert({ oficina_id: oficinaId, parcelas_sem_juros: parcelasSemJuros, juros_percentual: jurosPercentual }, { onConflict: 'oficina_id' })
    .select('*')
    .single()
  if (error) throw new Error(error.message)

  await registrarAuditoriaConfiguracao('parcelamento', oficinaId, funcionarioId, 'atualizado', { parcelasSemJuros, jurosPercentual })

  return mapParcelamento(data)
}
