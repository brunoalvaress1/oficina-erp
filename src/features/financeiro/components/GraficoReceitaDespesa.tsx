import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCurrency, formatDate } from '@/utils/format'
import type { PontoSerieDiaria } from '../types/dashboardFinanceiro'

interface GraficoReceitaDespesaProps {
  dados: PontoSerieDiaria[]
  isLoading?: boolean
}

export function GraficoReceitaDespesa({ dados, isLoading }: GraficoReceitaDespesaProps) {
  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando gráfico...</p>
  if (dados.length === 0) return <p className="text-sm text-muted-foreground">Sem dados no período.</p>

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={dados}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="data" tickFormatter={(valor) => formatDate(valor)} fontSize={11} />
        <YAxis fontSize={11} tickFormatter={(valor) => formatCurrency(valor)} width={90} />
        <Tooltip labelFormatter={(valor) => formatDate(String(valor))} formatter={(valor) => formatCurrency(Number(valor))} />
        <Legend />
        <Bar dataKey="entradas" name="Receitas" fill="#16a34a" radius={[4, 4, 0, 0]} />
        <Bar dataKey="saidas" name="Despesas" fill="#dc2626" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
