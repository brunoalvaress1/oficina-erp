import { calcularIntervaloPeriodo, ROTULO_PERIODO_FINANCEIRO, type PeriodoFinanceiro } from '@/features/financeiro/types/filtroFinanceiro'

// "Todas" não existe nos períodos do Financeiro (lá sempre tem um período
// ativo) — aqui faz diferença: em listas de histórico, filtrar por período
// por padrão esconderia silenciosamente registros antigos ainda relevantes,
// então o filtro de data começa desligado e é opt-in.
export type PeriodoOpcional = 'todas' | PeriodoFinanceiro

const PERIODOS: PeriodoOpcional[] = ['todas', 'hoje', 'ultimos_7_dias', 'ultimos_30_dias', 'este_mes', 'mes_anterior', 'este_ano', 'personalizado']

export interface FiltroPeriodoOpcionalState {
  periodo: PeriodoOpcional
  dataInicio: string
  dataFim: string
}

export function filtroPeriodoOpcionalPadrao(): FiltroPeriodoOpcionalState {
  return { periodo: 'todas', dataInicio: '', dataFim: '' }
}

interface FiltroPeriodoOpcionalProps {
  valor: FiltroPeriodoOpcionalState
  onChange: (valor: FiltroPeriodoOpcionalState) => void
}

export function FiltroPeriodoOpcional({ valor, onChange }: FiltroPeriodoOpcionalProps) {
  function handlePeriodo(periodo: PeriodoOpcional) {
    if (periodo === 'todas' || periodo === 'personalizado') {
      onChange({ periodo, dataInicio: periodo === 'todas' ? '' : valor.dataInicio, dataFim: periodo === 'todas' ? '' : valor.dataFim })
      return
    }
    onChange({ periodo, ...calcularIntervaloPeriodo(periodo) })
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {PERIODOS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => handlePeriodo(p)}
            className={`h-8 px-3 rounded-full text-xs font-medium border ${valor.periodo === p ? 'bg-primary text-primary-foreground border-primary' : 'bg-background'}`}
          >
            {p === 'todas' ? 'Todas' : ROTULO_PERIODO_FINANCEIRO[p]}
          </button>
        ))}
      </div>
      {valor.periodo === 'personalizado' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={valor.dataInicio}
            onChange={(e) => onChange({ ...valor, dataInicio: e.target.value })}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          />
          <span className="text-sm text-muted-foreground">até</span>
          <input
            type="date"
            value={valor.dataFim}
            onChange={(e) => onChange({ ...valor, dataFim: e.target.value })}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          />
        </div>
      )}
    </div>
  )
}
