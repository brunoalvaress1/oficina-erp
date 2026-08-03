import { useMemo } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCurrency } from '@/utils/format'
import type { PontoSerieMensal } from '../types/dashboardFinanceiro'

const NOMES_MES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

interface GraficoReceitasAnuaisProps {
  dados: PontoSerieMensal[]
  isLoading?: boolean
}

export function GraficoReceitasAnuais({ dados, isLoading }: GraficoReceitasAnuaisProps) {
  const serie = useMemo(
    () => dados.map((ponto) => ({ label: `${NOMES_MES[ponto.mes - 1]}/${String(ponto.ano).slice(2)}`, receita: ponto.receita })),
    [dados],
  )

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando gráfico...</p>
  if (serie.length === 0) return <p className="text-sm text-muted-foreground">Sem dados.</p>

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={serie}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="label" fontSize={11} />
        <YAxis fontSize={11} tickFormatter={(valor) => formatCurrency(valor)} width={90} />
        <Tooltip formatter={(valor) => formatCurrency(Number(valor))} />
        <Line type="monotone" dataKey="receita" name="Receita" stroke="#2563eb" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
