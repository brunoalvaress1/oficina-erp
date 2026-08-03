import { useDashboardCaixa } from '../hooks/useDashboardCaixa'
import { usePermissions } from '@/hooks/usePermissions'
import { formatCurrency } from '@/utils/format'

export function DashboardCaixa() {
  const { data, isLoading } = useDashboardCaixa()
  const { hasPermission } = usePermissions()
  const podeVerLucro = hasPermission('ordens.visualizar_lucro')

  if (isLoading || !data) {
    return (
      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <h2 className="font-medium">Resumo do Dia</h2>
      <div className="space-y-2 text-sm">
        <Linha label="Recebido Hoje" valor={formatCurrency(data.recebidoHoje)} destaque />
        <Linha label="PIX" valor={formatCurrency(data.recebidoPix)} />
        <Linha label="Dinheiro" valor={formatCurrency(data.recebidoDinheiro)} />
        <Linha label="Débito" valor={formatCurrency(data.recebidoDebito)} />
        <Linha label="Crédito" valor={formatCurrency(data.recebidoCredito)} />
        <Linha label="Boleto" valor={formatCurrency(data.recebidoBoleto)} />
        <div className="border-t pt-2 mt-2">
          <Linha label="Pendentes" valor={String(data.pendentes)} />
          <Linha label="Qtd. OS recebidas hoje" valor={String(data.quantidadeOs)} />
        </div>
        <div className="border-t pt-2 mt-2">
          <Linha label="Total Geral" valor={formatCurrency(data.totalGeral)} destaque />
          {podeVerLucro && <Linha label="Lucro Hoje" valor={formatCurrency(data.lucroHoje)} destaque />}
        </div>
      </div>
    </div>
  )
}

function Linha({ label, valor, destaque }: { label: string; valor: string; destaque?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={destaque ? 'font-semibold' : ''}>{valor}</span>
    </div>
  )
}
