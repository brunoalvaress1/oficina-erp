import { CalendarDays, CalendarRange } from 'lucide-react'
import { calcularIntervaloPeriodo, type PeriodoFinanceiro } from '@/features/financeiro/types/filtroFinanceiro'

// "Todas" não existe nos períodos do Financeiro (lá sempre tem um período
// ativo) — aqui faz diferença: em listas de histórico, filtrar por período
// por padrão esconderia silenciosamente registros antigos ainda relevantes,
// então o filtro de data começa desligado e é opt-in.
//
// Diferente do filtro do Financeiro, aqui não tem "últimos 7/30 dias" — pra
// notas fiscais o corte que importa de verdade é o mês (fechamento
// contábil/fiscal), então em vez disso tem "Mês específico" (escolhe
// qualquer mês/ano) além do atalho rápido de mês atual/anterior.
export type PeriodoOpcional = 'todas' | 'hoje' | 'este_mes' | 'mes_anterior' | 'este_ano' | 'mes_especifico' | 'personalizado'

const PERIODOS_RAPIDOS: { valor: PeriodoOpcional; rotulo: string }[] = [
  { valor: 'todas', rotulo: 'Todas' },
  { valor: 'hoje', rotulo: 'Hoje' },
  { valor: 'este_mes', rotulo: 'Este mês' },
  { valor: 'mes_anterior', rotulo: 'Mês anterior' },
  { valor: 'este_ano', rotulo: 'Este ano' },
]

export interface FiltroPeriodoOpcionalState {
  periodo: PeriodoOpcional
  dataInicio: string
  dataFim: string
  // Só usado quando periodo === 'mes_especifico' — formato 'YYYY-MM'.
  mes?: string
}

export function filtroPeriodoOpcionalPadrao(): FiltroPeriodoOpcionalState {
  return { periodo: 'todas', dataInicio: '', dataFim: '' }
}

// Mesma coisa, mas já começando filtrado no mês atual — usado em telas onde
// mostrar "Todas" de cara teria informação demais/desatualizada por padrão
// (ex: OS pagas aguardando nota fiscal, que interessa sobretudo o mês corrente).
export function filtroPeriodoOpcionalEsteMes(): FiltroPeriodoOpcionalState {
  return { periodo: 'este_mes', ...calcularIntervaloPeriodo('este_mes') }
}

function paraDataIso(data: Date): string {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`
}

function intervaloDoMes(mesIso: string): { dataInicio: string; dataFim: string } {
  const [ano, mes] = mesIso.split('-').map(Number)
  if (!ano || !mes) return { dataInicio: '', dataFim: '' }
  return { dataInicio: paraDataIso(new Date(ano, mes - 1, 1)), dataFim: paraDataIso(new Date(ano, mes, 0)) }
}

interface FiltroPeriodoOpcionalProps {
  valor: FiltroPeriodoOpcionalState
  onChange: (valor: FiltroPeriodoOpcionalState) => void
}

const CLASSE_PILL_BASE = 'h-8 px-3 rounded-full text-xs font-medium border whitespace-nowrap transition-colors'
const CLASSE_PILL_ATIVA = 'bg-primary text-primary-foreground border-primary'
const CLASSE_PILL_INATIVA = 'bg-background text-muted-foreground hover:text-foreground hover:bg-muted'

export function FiltroPeriodoOpcional({ valor, onChange }: FiltroPeriodoOpcionalProps) {
  function selecionarRapido(periodo: PeriodoOpcional) {
    if (periodo === 'todas') {
      onChange({ periodo, dataInicio: '', dataFim: '' })
      return
    }
    onChange({ periodo, ...calcularIntervaloPeriodo(periodo as PeriodoFinanceiro) })
  }

  function selecionarMesEspecifico() {
    const mes = valor.mes || new Date().toISOString().slice(0, 7)
    onChange({ periodo: 'mes_especifico', mes, ...intervaloDoMes(mes) })
  }

  function alterarMesEspecifico(mes: string) {
    onChange({ periodo: 'mes_especifico', mes, ...intervaloDoMes(mes) })
  }

  function selecionarPersonalizado() {
    onChange({ periodo: 'personalizado', dataInicio: valor.dataInicio, dataFim: valor.dataFim })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PERIODOS_RAPIDOS.map(({ valor: periodo, rotulo }) => (
        <button
          key={periodo}
          type="button"
          onClick={() => selecionarRapido(periodo)}
          className={`${CLASSE_PILL_BASE} ${valor.periodo === periodo ? CLASSE_PILL_ATIVA : CLASSE_PILL_INATIVA}`}
        >
          {rotulo}
        </button>
      ))}

      <button
        type="button"
        onClick={selecionarMesEspecifico}
        className={`${CLASSE_PILL_BASE} inline-flex items-center gap-1 ${valor.periodo === 'mes_especifico' ? CLASSE_PILL_ATIVA : CLASSE_PILL_INATIVA}`}
      >
        <CalendarDays size={13} /> Mês específico
      </button>
      {valor.periodo === 'mes_especifico' && (
        <input
          type="month"
          value={valor.mes ?? ''}
          onChange={(e) => alterarMesEspecifico(e.target.value)}
          className="h-8 rounded-md border bg-background px-2 text-xs outline-none focus:ring-1 focus:ring-primary/30"
        />
      )}

      <button
        type="button"
        onClick={selecionarPersonalizado}
        className={`${CLASSE_PILL_BASE} inline-flex items-center gap-1 ${valor.periodo === 'personalizado' ? CLASSE_PILL_ATIVA : CLASSE_PILL_INATIVA}`}
      >
        <CalendarRange size={13} /> Período personalizado
      </button>
      {valor.periodo === 'personalizado' && (
        <div className="inline-flex items-center gap-1.5">
          <input
            type="date"
            value={valor.dataInicio}
            onChange={(e) => onChange({ ...valor, dataInicio: e.target.value })}
            className="h-8 rounded-md border bg-background px-2 text-xs outline-none focus:ring-1 focus:ring-primary/30"
          />
          <span className="text-xs text-muted-foreground">até</span>
          <input
            type="date"
            value={valor.dataFim}
            onChange={(e) => onChange({ ...valor, dataFim: e.target.value })}
            className="h-8 rounded-md border bg-background px-2 text-xs outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
      )}
    </div>
  )
}
