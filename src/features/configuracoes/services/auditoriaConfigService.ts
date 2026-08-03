import { supabase } from '@/lib/supabase'
import { capturarIpPublico } from '@/utils/capturarIp'
import type { HistoricoConfiguracaoEntry } from '../types/historico'

// Toda alteração feita no módulo Configurações passa por aqui — cumpre o
// requisito de auditoria sem precisar de uma RPC dedicada por tabela (nenhuma
// dessas mudanças envolve dinheiro/estoque, então um insert direto do client
// é suficiente, ao contrário do padrão de RPC usado em Caixa/Financeiro).
export async function registrarAuditoriaConfiguracao(
  entidade: string,
  entidadeId: string | null,
  funcionarioId: string,
  acao: string,
  detalhes?: Record<string, unknown>,
): Promise<void> {
  const ip = await capturarIpPublico()
  const { error } = await supabase.from('configuracoes_historico').insert({
    entidade,
    entidade_id: entidadeId,
    funcionario_id: funcionarioId,
    acao,
    detalhes: detalhes ?? null,
    ip,
  })
  if (error) console.error('Erro ao registrar auditoria de configuração:', error.message)
}

export async function listarHistoricoConfiguracoes(entidade?: string): Promise<HistoricoConfiguracaoEntry[]> {
  let query = supabase
    .from('configuracoes_historico')
    .select('*, funcionarios(nome)')
    .order('created_at', { ascending: false })
    .limit(200)

  if (entidade) query = query.eq('entidade', entidade)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []).map((row: any) => ({
    id: row.id,
    entidade: row.entidade,
    entidadeId: row.entidade_id,
    funcionarioNome: row.funcionarios?.nome ?? null,
    acao: row.acao,
    detalhes: row.detalhes,
    ip: row.ip,
    createdAt: row.created_at,
  }))
}
