import { useState } from 'react'
import { DollarSign, Eye, EyeOff } from 'lucide-react'
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
  // Escondido por padrão só na tela — não é permissão, é pra não deixar valores
  // à mostra quando o cliente tá olhando o computador junto com o funcionário.
  const [visivel, setVisivel] = useState(true)

  return (
    <div className="rounded-lg border bg-card shadow-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center size-7 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <DollarSign size={15} />
          </div>
          <h2 className="font-medium">Resumo Financeiro</h2>
        </div>
        <button
          type="button"
          onClick={() => setVisivel((v) => !v)}
          title={visivel ? 'Ocultar resumo financeiro' : 'Mostrar resumo financeiro'}
          className="p-1.5 rounded hover:bg-muted text-muted-foreground"
        >
          {visivel ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
      </div>
      {visivel && (
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
          <div className="flex justify-between text-base font-semibold border-t pt-2 text-primary">
            <span>Total</span>
            <span>{formatCurrency(valorTotal)}</span>
          </div>
          {podeVerLucro && (
            <div className="flex justify-between border-t pt-2">
              <span className="text-muted-foreground">Lucro estimado</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                {lucroEstimado != null ? formatCurrency(lucroEstimado) : '-'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
