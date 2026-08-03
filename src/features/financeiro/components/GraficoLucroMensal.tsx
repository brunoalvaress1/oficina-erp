import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCurrency } from '@/utils/format'
import type { PontoSerieMensal } from '../types/dashboardFinanceiro'

const NOMES_MES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

interface GraficoLucroMensalProps {
  dados: PontoSerieMensal[]
  isLoading?: boolean
}

export function GraficoLucroMensal({ dados, isLoading }: GraficoLucroMensalProps) {
  const serie = useMemo(
    () => dados.map((ponto) => ({ label: `${NOMES_MES[ponto.mes - 1]}/${String(ponto.ano).slice(2)}`, lucro: ponto.receita - ponto.despesa })),
    [dados],
  )

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando gráfico...</p>
  if (serie.length === 0) return <p className="text-sm text-muted-foreground">Sem dados.</p>

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={serie}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="label" fontSize={11} />
        <YAxis fontSize={11} tickFormatter={(valor) => formatCurrency(valor)} width={90} />
        <Tooltip formatter={(valor) => formatCurrency(Number(valor))} />
        <Bar dataKey="lucro" name="Lucro" fill="#16a34a" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
