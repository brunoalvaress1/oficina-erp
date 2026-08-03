import { calcularIntervaloPeriodo, ROTULO_PERIODO_FINANCEIRO, type PeriodoFinanceiro } from '@/features/financeiro/types/filtroFinanceiro'

const PERIODOS: PeriodoFinanceiro[] = [
  'hoje',
  'ontem',
  'ultimos_7_dias',
  'ultimos_30_dias',
  'este_mes',
  'mes_anterior',
  'este_ano',
  'personalizado',
]

interface FiltroPeriodoProps {
  periodo: PeriodoFinanceiro
  dataInicio: string
  dataFim: string
  onChange: (valores: { periodo: PeriodoFinanceiro; dataInicio: string; dataFim: string }) => void
}

export function FiltroPeriodo({ periodo, dataInicio, dataFim, onChange }: FiltroPeriodoProps) {
  function handlePeriodo(novoPeriodo: PeriodoFinanceiro) {
    if (novoPeriodo === 'personalizado') {
      onChange({ periodo: novoPeriodo, dataInicio, dataFim })
      return
    }
    const intervalo = calcularIntervaloPeriodo(novoPeriodo)
    onChange({ periodo: novoPeriodo, ...intervalo })
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {PERIODOS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => handlePeriodo(p)}
            className={`h-8 px-3 rounded-full text-xs font-medium border ${periodo === p ? 'bg-primary text-primary-foreground border-primary' : 'bg-background'}`}
          >
            {ROTULO_PERIODO_FINANCEIRO[p]}
          </button>
        ))}
      </div>

      {periodo === 'personalizado' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => onChange({ periodo, dataInicio: e.target.value, dataFim })}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          />
          <span className="text-sm text-muted-foreground">até</span>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => onChange({ periodo, dataInicio, dataFim: e.target.value })}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          />
        </div>
      )}
    </div>
  )
}
