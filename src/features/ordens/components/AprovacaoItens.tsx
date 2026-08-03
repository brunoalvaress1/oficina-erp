import { Check, CheckCheck, X } from 'lucide-react'
import { formatCurrency } from '@/utils/format'
import type { OrdemServicoItem } from '../types/ordemServico'

interface AprovacaoItensProps {
  itens: OrdemServicoItem[]
  onAprovar: (itemId: string) => void
  onRecusar: (itemId: string) => void
  onAprovarTodos: () => void
  processando?: boolean
}

export function AprovacaoItens({ itens, onAprovar, onRecusar, onAprovarTodos, processando }: AprovacaoItensProps) {
  const aguardando = itens.filter((item) => item.statusAprovacao === 'aguardando')

  if (aguardando.length === 0) {
    return (
      <div className="rounded-lg border p-4">
        <h2 className="font-medium mb-1">Aprovação de Itens</h2>
        <p className="text-sm text-muted-foreground">Nenhum item aguardando aprovação.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Aprovação de Itens</h2>
        {aguardando.length > 1 && (
          <button
            type="button"
            disabled={processando}
            onClick={onAprovarTodos}
            className="flex items-center gap-1 h-8 px-3 rounded-md bg-green-600 text-white text-xs font-medium disabled:opacity-50"
          >
            <CheckCheck size={14} /> Aprovar Todos
          </button>
        )}
      </div>
      <div className="divide-y">
        {aguardando.map((item) => (
          <div key={item.id} className="py-2.5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{item.descricao}</p>
              <p className="text-xs text-muted-foreground">
                {item.quantidade}x {formatCurrency(item.valorUnitario)} = {formatCurrency(item.valorTotal)}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                disabled={processando}
                onClick={() => onAprovar(item.id)}
                className="flex items-center gap-1 h-8 px-3 rounded-md bg-green-600 text-white text-xs font-medium disabled:opacity-50"
              >
                <Check size={14} /> Aprovar
              </button>
              <button
                type="button"
                disabled={processando}
                onClick={() => onRecusar(item.id)}
                className="flex items-center gap-1 h-8 px-3 rounded-md bg-destructive text-destructive-foreground text-xs font-medium disabled:opacity-50"
              >
                <X size={14} /> Recusar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
