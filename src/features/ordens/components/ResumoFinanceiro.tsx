import { formatCurrency } from '@/utils/format'

interface ResumoFinanceiroProps {
  valorProdutos: number
  valorServicos: number
  valorDesconto: number
  valorTotal: number
  lucroEstimado: number | null
  podeVerLucro: boolean
}

export function ResumoFinanceiro({
  valorProdutos,
  valorServicos,
  valorDesconto,
  valorTotal,
  lucroEstimado,
  podeVerLucro,
}: ResumoFinanceiroProps) {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <h2 className="font-medium">Resumo Financeiro</h2>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Produtos</span>
          <span>{formatCurrency(valorProdutos)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Serviços</span>
          <span>{formatCurrency(valorServicos)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Descontos</span>
          <span>-{formatCurrency(valorDesconto)}</span>
        </div>
        <div className="flex justify-between border-t pt-2">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatCurrency(valorProdutos + valorServicos)}</span>
        </div>
        <div className="flex justify-between text-base font-semibold border-t pt-2">
          <span>Total</span>
          <span>{formatCurrency(valorTotal)}</span>
        </div>
        {podeVerLucro && (
          <div className="flex justify-between border-t pt-2">
            <span className="text-muted-foreground">Lucro estimado</span>
            <span>{lucroEstimado != null ? formatCurrency(lucroEstimado) : '-'}</span>
          </div>
        )}
      </div>
    </div>
  )
}
