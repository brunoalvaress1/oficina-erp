import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCurrency } from '@/utils/format'
import type { PontoPorCategoria } from '../types/dashboardFinanceiro'

interface GraficoPorCategoriaProps {
  dados: PontoPorCategoria[]
  isLoading?: boolean
}

export function GraficoPorCategoria({ dados, isLoading }: GraficoPorCategoriaProps) {
  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando gráfico...</p>
  if (dados.length === 0) return <p className="text-sm text-muted-foreground">Sem dados no período.</p>

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, dados.length * 36)}>
      <BarChart data={dados} layout="vertical" margin={{ left: 24 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis type="number" fontSize={11} tickFormatter={(valor) => formatCurrency(valor)} />
        <YAxis type="category" dataKey="categoriaNome" fontSize={11} width={120} />
        <Tooltip formatter={(valor) => formatCurrency(Number(valor))} />
        <Bar dataKey="total" fill="#2563eb" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
