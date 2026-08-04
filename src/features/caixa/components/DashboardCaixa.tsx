import { Wallet } from 'lucide-react'
import { useDashboardCaixa } from '../hooks/useDashboardCaixa'
import { usePermissions } from '@/hooks/usePermissions'
import { formatCurrency } from '@/utils/format'
import { cn } from '@/lib/utils'

export function DashboardCaixa() {
  const { data, isLoading } = useDashboardCaixa()
  const { hasPermission } = usePermissions()
  const podeVerLucro = hasPermission('ordens.visualizar_lucro')

  if (isLoading || !data) {
    return (
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3 shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center size-7 rounded-md bg-primary/10 text-primary">
          <Wallet size={15} />
        </div>
        <h2 className="font-medium">Resumo do Dia</h2>
      </div>
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
          <Linha label="Total Geral" valor={formatCurrency(data.totalGeral)} destaque cor="text-primary" />
          {podeVerLucro && (
            <Linha label="Lucro Hoje" valor={formatCurrency(data.lucroHoje)} destaque cor="text-emerald-600 dark:text-emerald-400" />
          )}
        </div>
      </div>
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
