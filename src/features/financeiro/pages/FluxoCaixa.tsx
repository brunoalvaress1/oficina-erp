import { useMemo, useState } from 'react'
import { formatCurrency } from '@/utils/format'
import { CardIndicador } from '../components/CardIndicador'
import { FiltroFinanceiroBar } from '../components/FiltroFinanceiroBar'
import { GraficoFluxoCaixaDiario } from '../components/GraficoFluxoCaixaDiario'
import { useSerieDiariaFinanceiro } from '../hooks/useDashboardFinanceiro'
import { useContasBancariasLista, useSaldosContas } from '../hooks/useContasBancariasFinanceiro'
import { useContasReceber } from '../hooks/useContasReceber'
import { useContasPagar } from '../hooks/useContasPagar'
import { criarFiltroFinanceiroPadrao, type FiltroFinanceiro } from '../types/filtroFinanceiro'

export function FluxoCaixa() {
  const [filtro, setFiltro] = useState<FiltroFinanceiro>(criarFiltroFinanceiroPadrao())

  const { data: serieDiaria, isLoading } = useSerieDiariaFinanceiro(filtro)
  const { data: contas } = useContasBancariasLista()
  const { data: saldos } = useSaldosContas()
  const { data: receberResp } = useContasReceber({ page: 1, pageSize: 1000, status: 'todas' })
  const { data: pagarResp } = useContasPagar({ page: 1, pageSize: 1000, status: 'todas' })

  const contasFiltradas = useMemo(
    () => (filtro.contaBancariaId ? (contas ?? []).filter((c) => c.id === filtro.contaBancariaId) : contas ?? []),
    [contas, filtro.contaBancariaId],
  )

  const saldoInicial = contasFiltradas.reduce((soma, c) => soma + c.saldoInicial, 0)
  const saldoAtual = contasFiltradas.reduce((soma, c) => soma + (saldos?.[c.id] ?? c.saldoInicial), 0)

  const totalReceber = (receberResp?.data ?? [])
    .filter((c) => c.status === 'pendente' || c.status === 'parcial' || c.status === 'atrasado')
    .reduce((soma, c) => soma + (c.valor - c.valorRecebido), 0)
  const totalPagar = (pagarResp?.data ?? [])
    .filter((c) => c.status === 'pendente' || c.status === 'parcial' || c.status === 'atrasado')
    .reduce((soma, c) => soma + (c.valor - c.valorPago), 0)

  const saldoPrevisto = saldoAtual + totalReceber - totalPagar
  const totalEntradas = (serieDiaria ?? []).reduce((soma, p) => soma + p.entradas, 0)
  const totalSaidas = (serieDiaria ?? []).reduce((soma, p) => soma + p.saidas, 0)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Fluxo de Caixa</h1>

      <FiltroFinanceiroBar filtro={filtro} onChange={setFiltro} mostrarFiltrosAvancados={false} />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <CardIndicador titulo="Entradas" valor={formatCurrency(totalEntradas)} destaque="positivo" />
        <CardIndicador titulo="Saídas" valor={formatCurrency(totalSaidas)} destaque="negativo" />
        <CardIndicador titulo="Saldo Inicial" valor={formatCurrency(saldoInicial)} />
        <CardIndicador titulo="Saldo Atual" valor={formatCurrency(saldoAtual)} destaque={saldoAtual >= 0 ? 'positivo' : 'negativo'} />
        <CardIndicador titulo="Saldo Previsto" valor={formatCurrency(saldoPrevisto)} />
        <CardIndicador titulo="Saldo Real" valor={formatCurrency(saldoAtual)} />
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="font-medium text-sm mb-2">Fluxo de Caixa Diário</h2>
        <GraficoFluxoCaixaDiario dados={serieDiaria ?? []} saldoInicial={saldoInicial} isLoading={isLoading} />
      </div>
    </div>
  )
}
