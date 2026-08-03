import { useMemo } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCurrency, formatDate } from '@/utils/format'
import type { PontoSerieDiaria } from '../types/dashboardFinanceiro'

interface GraficoFluxoCaixaDiarioProps {
  dados: PontoSerieDiaria[]
  saldoInicial: number
  isLoading?: boolean
}

export function GraficoFluxoCaixaDiario({ dados, saldoInicial, isLoading }: GraficoFluxoCaixaDiarioProps) {
  const serie = useMemo(() => {
    let acumulado = saldoInicial
    return dados.map((ponto) => {
      acumulado += ponto.entradas - ponto.saidas
      return { data: ponto.data, saldo: acumulado }
    })
  }, [dados, saldoInicial])

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando gráfico...</p>
  if (serie.length === 0) return <p className="text-sm text-muted-foreground">Sem dados no período.</p>

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={serie}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="data" tickFormatter={(valor) => formatDate(valor)} fontSize={11} />
        <YAxis fontSize={11} tickFormatter={(valor) => formatCurrency(valor)} width={90} />
        <Tooltip labelFormatter={(valor) => formatDate(String(valor))} formatter={(valor) => formatCurrency(Number(valor))} />
        <Line type="monotone" dataKey="saldo" name="Saldo" stroke="#2563eb" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
