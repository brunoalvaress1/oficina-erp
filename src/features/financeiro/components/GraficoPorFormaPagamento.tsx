import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { ROTULO_FORMA_PAGAMENTO, type FormaPagamento } from '@/features/caixa/types/caixa'
import { formatCurrency } from '@/utils/format'
import type { PontoPorFormaPagamento } from '../types/dashboardFinanceiro'

const CORES = ['#16a34a', '#2563eb', '#f59e0b', '#dc2626', '#8b5cf6', '#0891b2', '#db2777', '#65a30d', '#78716c']

interface GraficoPorFormaPagamentoProps {
  dados: PontoPorFormaPagamento[]
  isLoading?: boolean
}

export function GraficoPorFormaPagamento({ dados, isLoading }: GraficoPorFormaPagamentoProps) {
  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando gráfico...</p>
  if (dados.length === 0) return <p className="text-sm text-muted-foreground">Sem dados no período.</p>

  const dadosComRotulo = dados.map((ponto) => ({
    nome: ROTULO_FORMA_PAGAMENTO[ponto.formaPagamento as FormaPagamento] ?? ponto.formaPagamento,
    total: ponto.total,
  }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={dadosComRotulo} dataKey="total" nameKey="nome" cx="50%" cy="50%" outerRadius={90} label>
          {dadosComRotulo.map((_, indice) => (
            <Cell key={indice} fill={CORES[indice % CORES.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(valor) => formatCurrency(Number(valor))} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
