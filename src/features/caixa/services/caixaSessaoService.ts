import { supabase } from '@/lib/supabase'
import type { CaixaSessao, ResumoSessaoCaixa } from '../types/caixaSessao'

function mapSessao(row: any): CaixaSessao {
  return {
    id: row.id,
    oficinaId: row.oficina_id,
    funcionarioAberturaId: row.funcionario_abertura_id,
    funcionarioAberturaNome: row.funcionario_abertura?.nome,
    funcionarioFechamentoId: row.funcionario_fechamento_id,
    funcionarioFechamentoNome: row.funcionario_fechamento?.nome,
    valorAbertura: Number(row.valor_abertura ?? 0),
    status: row.status,
    observacoesAbertura: row.observacoes_abertura,
    observacoesFechamento: row.observacoes_fechamento,
    valorContadoFechamento: row.valor_contado_fechamento != null ? Number(row.valor_contado_fechamento) : null,
    diferencaCaixa: row.diferenca_caixa != null ? Number(row.diferenca_caixa) : null,
    dataAbertura: row.data_abertura,
    dataFechamento: row.data_fechamento,
    createdAt: row.created_at,
  }
}

const SELECT_SESSAO = `
  *,
  funcionario_abertura:funcionarios!caixa_sessoes_funcionario_abertura_id_fkey (nome),
  funcionario_fechamento:funcionarios!caixa_sessoes_funcionario_fechamento_id_fkey (nome)
`

function traduzirErro(mensagem: string): string {
  if (mensagem.includes('CAIXA_JA_ABERTO')) return 'Já existe um caixa aberto.'
  if (mensagem.includes('SESSAO_NAO_ENCONTRADA')) return 'Sessão de caixa não encontrada.'
  if (mensagem.includes('SESSAO_JA_FECHADA')) return 'Essa sessão de caixa já foi fechada.'
  return mensagem
}

export async function buscarSessaoAberta(oficinaId: string): Promise<CaixaSessao | null> {
  const { data, error } = await supabase
    .from('caixa_sessoes')
    .select(SELECT_SESSAO)
    .eq('oficina_id', oficinaId)
    .eq('status', 'aberto')
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data ? mapSessao(data) : null
}

export async function abrirCaixa(
  oficinaId: string,
  funcionarioId: string,
  valorAbertura: number,
  observacoes?: string,
): Promise<string> {
  const { data, error } = await supabase.rpc('caixa_abrir_sessao', {
    p_oficina_id: oficinaId,
    p_funcionario_id: funcionarioId,
    p_valor_abertura: valorAbertura,
    p_observacoes: observacoes || null,
  })
  if (error) throw new Error(traduzirErro(error.message))
  return data as string
}

export async function fecharCaixa(
  caixaSessaoId: string,
  funcionarioId: string,
  valorContado: number,
  observacoes?: string,
): Promise<void> {
  const { error } = await supabase.rpc('caixa_fechar_sessao', {
    p_caixa_sessao_id: caixaSessaoId,
    p_funcionario_id: funcionarioId,
    p_observacoes: observacoes || null,
    p_valor_contado: valorContado,
  })
  if (error) throw new Error(traduzirErro(error.message))
}

export async function buscarResumoSessao(caixaSessaoId: string): Promise<ResumoSessaoCaixa> {
  const sessaoResp = await supabase.from('caixa_sessoes').select(SELECT_SESSAO).eq('id', caixaSessaoId).single()
  if (sessaoResp.error) throw new Error(sessaoResp.error.message)
  const sessao = mapSessao(sessaoResp.data)

  const recebimentosResp = await supabase
    .from('caixa_recebimentos')
    .select(
      'id, valor_total, created_at, caixa_recebimento_formas(valor, forma_pagamento), caixa_lancamentos(ordens_servico(numero, clientes(nome)))',
    )
    .eq('caixa_sessao_id', caixaSessaoId)
    .eq('cancelado', false)
    .order('created_at', { ascending: true })

  if (recebimentosResp.error) throw new Error(recebimentosResp.error.message)

  const recebimentos = recebimentosResp.data ?? []
  const formas = recebimentos.flatMap((r: any) => r.caixa_recebimento_formas ?? [])

  function somaPorForma(forma: string): number {
    return formas.filter((f: any) => f.forma_pagamento === forma).reduce((soma: number, f: any) => soma + Number(f.valor), 0)
  }

  const totalDinheiro = somaPorForma('dinheiro')

  return {
    sessao,
    totalDinheiro,
    totalPix: somaPorForma('pix'),
    totalDebito: somaPorForma('debito'),
    totalCredito: somaPorForma('credito'),
    totalTransferencia: somaPorForma('transferencia'),
    totalCheque: somaPorForma('cheque'),
    totalCrediario: somaPorForma('crediario'),
    totalBoleto: somaPorForma('boleto'),
    totalOutros: somaPorForma('outros'),
    totalGeral: recebimentos.reduce((soma: number, r: any) => soma + Number(r.valor_total), 0),
    quantidadeRecebimentos: recebimentos.length,
    valorEsperadoDinheiro: sessao.valorAbertura + totalDinheiro,
    recebimentos: recebimentos.map((r: any) => ({
      ordemNumero: Number(r.caixa_lancamentos?.ordens_servico?.numero ?? 0),
      clienteNome: r.caixa_lancamentos?.ordens_servico?.clientes?.nome ?? null,
      valorTotal: Number(r.valor_total),
      createdAt: r.created_at,
    })),
  }
}
