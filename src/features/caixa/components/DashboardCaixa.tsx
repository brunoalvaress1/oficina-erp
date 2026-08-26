import { useState } from 'react'
import { Wallet } from 'lucide-react'
import { useDashboardCaixa } from '../hooks/useDashboardCaixa'
import { formatCurrency } from '@/utils/format'
import { cn } from '@/lib/utils'
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

interface FiltroPeriodoResumo {
  periodo: PeriodoFinanceiro
  dataInicio: string
  dataFim: string
}

function filtroResumoPadrao(): FiltroPeriodoResumo {
  return { periodo: 'hoje', ...calcularIntervaloPeriodo('hoje') }
}

// Lucro não aparece aqui de propósito, nem pra quem tem permissão — só é
// mostrado no momento do fechamento do caixa (ver FecharCaixaModal), pra não
// ficar exposto no dia a dia.
export function DashboardCaixa() {
  const [filtro, setFiltro] = useState<FiltroPeriodoResumo>(filtroResumoPadrao)
  const { data, isLoading } = useDashboardCaixa(filtro.dataInicio, filtro.dataFim)

  function handlePeriodo(periodo: PeriodoFinanceiro) {
    if (periodo === 'personalizado') {
      setFiltro((atual) => ({ ...atual, periodo }))
      return
    }
    setFiltro({ periodo, ...calcularIntervaloPeriodo(periodo) })
  }

  const ehHoje = filtro.periodo === 'hoje'
  const rotuloRecebido = ehHoje ? 'Recebido Hoje' : 'Recebido no Período'
  const rotuloQuantidade = ehHoje ? 'Qtd. OS recebidas hoje' : 'Qtd. OS recebidas no período'
  const rotuloDescontos = ehHoje ? 'Descontos Hoje' : 'Descontos no Período'

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3 shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center size-7 rounded-md bg-primary/10 text-primary">
          <Wallet size={15} />
        </div>
        <h2 className="font-medium">{ehHoje ? 'Resumo do Dia' : 'Resumo do Período'}</h2>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PERIODOS.map((periodo) => (
          <button
            key={periodo}
            type="button"
            onClick={() => handlePeriodo(periodo)}
            className={`h-7 px-2.5 rounded-full text-xs font-medium border ${
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
            onChange={(e) => setFiltro((atual) => ({ ...atual, dataInicio: e.target.value }))}
            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
          />
          <span className="text-sm text-muted-foreground">até</span>
          <input
            type="date"
            value={filtro.dataFim}
            onChange={(e) => setFiltro((atual) => ({ ...atual, dataFim: e.target.value }))}
            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
          />
        </div>
      )}

      {isLoading || !data ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <div className="space-y-2 text-sm">
          <Linha label={rotuloRecebido} valor={formatCurrency(data.recebidoHoje)} destaque />
          <Linha label="PIX" valor={formatCurrency(data.recebidoPix)} />
          <Linha label="Dinheiro" valor={formatCurrency(data.recebidoDinheiro)} />
          <Linha label="Débito" valor={formatCurrency(data.recebidoDebito)} />
          <Linha label="Crédito" valor={formatCurrency(data.recebidoCredito)} />
          <Linha label="Boleto" valor={formatCurrency(data.recebidoBoleto)} />
          <div className="border-t pt-2 mt-2">
            <Linha label={rotuloDescontos} valor={formatCurrency(data.descontosHoje)} />
            <Linha label="Pendentes" valor={String(data.pendentes)} />
            <Linha label={rotuloQuantidade} valor={String(data.quantidadeOs)} />
          </div>
          <div className="border-t pt-2 mt-2">
            <Linha label="Total Geral" valor={formatCurrency(data.totalGeral)} destaque cor="text-primary" />
          </div>
        </div>
      )}
    </div>
  )
}

function Linha({ label, valor, destaque, cor }: { label: string; valor: string; destaque?: boolean; cor?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn(destaque && 'font-semibold', cor)}>{valor}</span>
    </div>
  )
}
