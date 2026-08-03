export type PeriodoFinanceiro =
  | 'hoje'
  | 'ontem'
  | 'ultimos_7_dias'
  | 'ultimos_30_dias'
  | 'este_mes'
  | 'mes_anterior'
  | 'este_ano'
  | 'personalizado'

export const ROTULO_PERIODO_FINANCEIRO: Record<PeriodoFinanceiro, string> = {
  hoje: 'Hoje',
  ontem: 'Ontem',
  ultimos_7_dias: 'Últimos 7 dias',
  ultimos_30_dias: 'Últimos 30 dias',
  este_mes: 'Este mês',
  mes_anterior: 'Mês anterior',
  este_ano: 'Este ano',
  personalizado: 'Período personalizado',
}

export interface FiltroFinanceiro {
  periodo: PeriodoFinanceiro
  dataInicio: string
  dataFim: string
  contaBancariaId: string | null
  formaPagamento: string | null
  responsavelId: string | null
  categoriaId: string | null
  centroCustoId: string | null
}

function paraDataIso(data: Date): string {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`
}

export function calcularIntervaloPeriodo(periodo: PeriodoFinanceiro): { dataInicio: string; dataFim: string } {
  const hoje = new Date()
  const hojeIso = paraDataIso(hoje)

  switch (periodo) {
    case 'hoje':
      return { dataInicio: hojeIso, dataFim: hojeIso }
    case 'ontem': {
      const ontem = new Date(hoje)
      ontem.setDate(ontem.getDate() - 1)
      return { dataInicio: paraDataIso(ontem), dataFim: paraDataIso(ontem) }
    }
    case 'ultimos_7_dias': {
      const inicio = new Date(hoje)
      inicio.setDate(inicio.getDate() - 6)
      return { dataInicio: paraDataIso(inicio), dataFim: hojeIso }
    }
    case 'ultimos_30_dias': {
      const inicio = new Date(hoje)
      inicio.setDate(inicio.getDate() - 29)
      return { dataInicio: paraDataIso(inicio), dataFim: hojeIso }
    }
    case 'este_mes': {
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      return { dataInicio: paraDataIso(inicio), dataFim: hojeIso }
    }
    case 'mes_anterior': {
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
      const fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0)
      return { dataInicio: paraDataIso(inicio), dataFim: paraDataIso(fim) }
    }
    case 'este_ano': {
      const inicio = new Date(hoje.getFullYear(), 0, 1)
      return { dataInicio: paraDataIso(inicio), dataFim: hojeIso }
    }
    default:
      return { dataInicio: hojeIso, dataFim: hojeIso }
  }
}

export function criarFiltroFinanceiroPadrao(): FiltroFinanceiro {
  const { dataInicio, dataFim } = calcularIntervaloPeriodo('este_mes')
  return {
    periodo: 'este_mes',
    dataInicio,
    dataFim,
    contaBancariaId: null,
    formaPagamento: null,
    responsavelId: null,
    categoriaId: null,
    centroCustoId: null,
  }
}
