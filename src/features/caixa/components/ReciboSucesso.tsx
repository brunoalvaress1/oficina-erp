import { CheckCircle2, Printer } from 'lucide-react'
import { formatCurrency } from '@/utils/format'

interface ReciboSucessoProps {
  numeroOrdem: number
  valorTotal: number
  onImprimir: () => void
  onFechar: () => void
  imprimindo?: boolean
}

export function ReciboSucesso({ numeroOrdem, valorTotal, onImprimir, onFechar, imprimindo }: ReciboSucessoProps) {
  return (
    <div className="space-y-4 text-center py-4">
      <CheckCircle2 size={48} className="mx-auto text-green-600" />
      <div>
        <p className="text-lg font-semibold">Pagamento realizado com sucesso</p>
        <p className="text-sm text-muted-foreground">
          OS nº {numeroOrdem} · {formatCurrency(valorTotal)}
        </p>
      </div>
      <div className="flex gap-2 justify-center">
        <button
          type="button"
          onClick={onImprimir}
          disabled={imprimindo}
          className="flex items-center gap-2 h-10 px-4 rounded-md border text-sm font-medium disabled:opacity-50"
        >
          <Printer size={15} /> {imprimindo ? 'Gerando...' : 'Imprimir OS'}
        </button>
        <button
          type="button"
          onClick={onFechar}
          className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium"
        >
          Fechar
        </button>
      </div>
    </div>
  )
}
