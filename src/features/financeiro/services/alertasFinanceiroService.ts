import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/utils/format'
import type { AlertaFinanceiro } from '../types/dashboardFinanceiro'

function hojeIso(): string {
  const hoje = new Date()
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`
}

function dataMenosDias(dias: number): string {
  const data = new Date()
  data.setDate(data.getDate() - dias)
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`
}

export async function buscarAlertasFinanceiros(oficinaId: string): Promise<AlertaFinanceiro[]> {
  const hoje = hojeIso()
  const limite30Dias = dataMenosDias(30)
  const alertas: AlertaFinanceiro[] = []

  const [receberResp, pagarResp, contasResp, sessoesResp] = await Promise.all([
    supabase
      .from('contas_receber')
      .select('id, descricao, valor, valor_recebido, data_vencimento')
      .eq('oficina_id', oficinaId)
      .in('status', ['pendente', 'parcial']),
    supabase
      .from('contas_pagar')
      .select('id, descricao, valor, valor_pago, data_vencimento')
      .eq('oficina_id', oficinaId)
      .in('status', ['pendente', 'parcial']),
    supabase.from('contas_bancarias').select('id, nome, saldo_minimo_alerta').eq('oficina_id', oficinaId).eq('ativo', true),
    supabase
      .from('caixa_sessoes')
      .select('id, diferenca_caixa, data_fechamento')
      .eq('oficina_id', oficinaId)
      .eq('status', 'fechado')
      .not('diferenca_caixa', 'is', null)
      .order('data_fechamento', { ascending: false })
      .limit(5),
  ])

  const vencendoHoje = [...(receberResp.data ?? []), ...(pagarResp.data ?? [])].filter((c) => c.data_vencimento === hoje)
  if (vencendoHoje.length > 0) {
    alertas.push({
      tipo: 'conta_vencendo_hoje',
      titulo: `${vencendoHoje.length} conta(s) vencendo hoje`,
      descricao: 'Existem contas a pagar/receber com vencimento hoje.',
      severidade: 'aviso',
    })
  }

  const vencidas = [...(receberResp.data ?? []), ...(pagarResp.data ?? [])].filter((c) => c.data_vencimento < hoje)
  if (vencidas.length > 0) {
    alertas.push({
      tipo: 'conta_vencida',
      titulo: `${vencidas.length} conta(s) vencida(s)`,
      descricao: 'Existem contas a pagar/receber com vencimento no passado.',
      severidade: 'critico',
    })
  }

  const pendencias30 = [...(receberResp.data ?? []), ...(pagarResp.data ?? [])].filter((c) => c.data_vencimento < limite30Dias)
  if (pendencias30.length > 0) {
    alertas.push({
      tipo: 'pendencia_30_dias',
      titulo: `${pendencias30.length} pendência(s) há mais de 30 dias`,
      descricao: 'Contas em aberto vencidas há mais de 30 dias.',
      severidade: 'critico',
    })
  }

  const contasComLimite = (contasResp.data ?? []).filter((c: any) => c.saldo_minimo_alerta != null)
  if (contasComLimite.length > 0) {
    const { data: saldos } = await supabase.rpc('financeiro_saldos_contas', { p_oficina_id: oficinaId })
    const mapaSaldos = new Map<string, number>((saldos ?? []).map((s: any) => [s.conta_bancaria_id, Number(s.saldo_atual ?? 0)]))
    for (const conta of contasComLimite as any[]) {
      const saldoAtual = mapaSaldos.get(conta.id) ?? 0
      if (saldoAtual < Number(conta.saldo_minimo_alerta)) {
        alertas.push({
          tipo: 'saldo_baixo',
          titulo: `Saldo baixo em ${conta.nome}`,
          descricao: `Saldo atual (${formatCurrency(saldoAtual)}) abaixo do mínimo configurado (${formatCurrency(Number(conta.saldo_minimo_alerta))}).`,
          severidade: 'critico',
        })
      }
    }
  }

  for (const sessao of (sessoesResp.data ?? []) as any[]) {
    const diferenca = Number(sessao.diferenca_caixa ?? 0)
    if (Math.abs(diferenca) > 0.01) {
      alertas.push({
        tipo: 'diferenca_caixa',
        titulo: `Diferença de caixa de ${formatCurrency(diferenca)}`,
        descricao: `Fechamento de caixa em ${new Date(sessao.data_fechamento).toLocaleDateString('pt-BR')} teve divergência.`,
        severidade: 'aviso',
      })
    }
  }

  return alertas
}
