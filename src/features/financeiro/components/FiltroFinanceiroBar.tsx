import { useFuncionariosSelect } from '@/features/estoque/hooks/useFuncionariosSelect'
import { ROTULO_FORMA_PAGAMENTO, type FormaPagamento } from '@/features/caixa/types/caixa'
import { useCategoriasFinanceirasLista } from '../hooks/useCategoriasFinanceiras'
import { useCentrosCustoLista } from '../hooks/useCentrosCusto'
import { useContasBancariasLista } from '../hooks/useContasBancariasFinanceiro'
import { calcularIntervaloPeriodo, ROTULO_PERIODO_FINANCEIRO, type FiltroFinanceiro, type PeriodoFinanceiro } from '../types/filtroFinanceiro'

interface FiltroFinanceiroBarProps {
  filtro: FiltroFinanceiro
  onChange: (filtro: FiltroFinanceiro) => void
  mostrarFiltrosAvancados?: boolean
}

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

const FORMAS_PAGAMENTO: FormaPagamento[] = ['dinheiro', 'pix', 'debito', 'credito', 'transferencia', 'cheque', 'crediario', 'boleto', 'outros']

export function FiltroFinanceiroBar({ filtro, onChange, mostrarFiltrosAvancados = true }: FiltroFinanceiroBarProps) {
  const { data: contas } = useContasBancariasLista()
  const { data: categorias } = useCategoriasFinanceirasLista()
  const { data: centrosCusto } = useCentrosCustoLista()
  const { data: funcionarios } = useFuncionariosSelect()

  function handlePeriodo(periodo: PeriodoFinanceiro) {
    if (periodo === 'personalizado') {
      onChange({ ...filtro, periodo })
      return
    }
    const { dataInicio, dataFim } = calcularIntervaloPeriodo(periodo)
    onChange({ ...filtro, periodo, dataInicio, dataFim })
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {PERIODOS.map((periodo) => (
          <button
            key={periodo}
            type="button"
            onClick={() => handlePeriodo(periodo)}
            className={`h-8 px-3 rounded-full text-xs font-medium border ${
              filtro.periodo === periodo ? 'bg-primary text-primary-foreground border-primary' : 'bg-background'
            }`}
          >
            {ROTULO_PERIODO_FINANCEIRO[periodo]}
          </button>
        ))}
      </div>

      {filtro.periodo === 'personalizado' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={filtro.dataInicio}
            onChange={(e) => onChange({ ...filtro, dataInicio: e.target.value })}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          />
          <span className="text-sm text-muted-foreground">até</span>
          <input
            type="date"
            value={filtro.dataFim}
            onChange={(e) => onChange({ ...filtro, dataFim: e.target.value })}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          />
        </div>
      )}

      {mostrarFiltrosAvancados && (
        <div className="flex flex-wrap gap-2">
          <select
            value={filtro.contaBancariaId ?? ''}
            onChange={(e) => onChange({ ...filtro, contaBancariaId: e.target.value || null })}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          >
            <option value="">Todas as contas</option>
            {(contas ?? []).map((conta) => (
              <option key={conta.id} value={conta.id}>
                {conta.nome}
              </option>
            ))}
          </select>

          <select
            value={filtro.formaPagamento ?? ''}
            onChange={(e) => onChange({ ...filtro, formaPagamento: e.target.value || null })}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          >
            <option value="">Todas as formas</option>
            {FORMAS_PAGAMENTO.map((forma) => (
              <option key={forma} value={forma}>
                {ROTULO_FORMA_PAGAMENTO[forma]}
              </option>
            ))}
          </select>

          <select
            value={filtro.responsavelId ?? ''}
            onChange={(e) => onChange({ ...filtro, responsavelId: e.target.value || null })}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          >
            <option value="">Todos os responsáveis</option>
            {(funcionarios ?? []).map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>

          <select
            value={filtro.categoriaId ?? ''}
            onChange={(e) => onChange({ ...filtro, categoriaId: e.target.value || null })}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          >
            <option value="">Todas as categorias</option>
            {(categorias ?? []).map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nome}
              </option>
            ))}
          </select>

          <select
            value={filtro.centroCustoId ?? ''}
            onChange={(e) => onChange({ ...filtro, centroCustoId: e.target.value || null })}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          >
            <option value="">Todos os centros de custo</option>
            {(centrosCusto ?? []).map((centro) => (
              <option key={centro.id} value={centro.id}>
                {centro.nome}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
