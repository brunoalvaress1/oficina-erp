import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CampoMoeda } from '@/components/ui/CampoMoeda'
import { useAbrirCaixa } from '../hooks/useCaixaSessao'

interface AbrirCaixaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AbrirCaixaModal({ open, onOpenChange }: AbrirCaixaModalProps) {
  const [valorAbertura, setValorAbertura] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const abrirMutation = useAbrirCaixa()

  function handleAbrir() {
    abrirMutation.mutate(
      { valorAbertura: Number(valorAbertura) || 0, observacoes: observacoes || undefined },
      {
        onSuccess: () => {
          setValorAbertura('')
          setObservacoes('')
          onOpenChange(false)
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Abrir Caixa</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Valor de Abertura (fundo de troco)</label>
            <CampoMoeda
              value={valorAbertura}
              onChange={setValorAbertura}
              className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Observações (opcional)</label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
              className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <button
            type="button"
            onClick={handleAbrir}
            disabled={abrirMutation.isPending}
            className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
          >
            {abrirMutation.isPending ? 'Abrindo...' : 'Abrir Caixa'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
