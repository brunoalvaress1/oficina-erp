import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CampoMoeda } from '@/components/ui/CampoMoeda'
import { ArrowRight } from 'lucide-react'
import { useContasBancariasLista, useCriarTransferencia } from '../hooks/useContasBancariasFinanceiro'

interface TransferenciaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TransferenciaModal({ open, onOpenChange }: TransferenciaModalProps) {
  const { data: contas } = useContasBancariasLista()
  const [contaOrigemId, setContaOrigemId] = useState('')
  const [contaDestinoId, setContaDestinoId] = useState('')
  const [valor, setValor] = useState('')
  const [dataTransferencia, setDataTransferencia] = useState(() => new Date().toISOString().slice(0, 10))
  const [observacoes, setObservacoes] = useState('')

  const criarTransferencia = useCriarTransferencia()

  function limpar() {
    setContaOrigemId('')
    setContaDestinoId('')
    setValor('')
    setObservacoes('')
  }

  function handleSalvar() {
    criarTransferencia.mutate(
      { contaOrigemId, contaDestinoId, valor: Number(valor) || 0, dataTransferencia, observacoes: observacoes || undefined },
      { onSuccess: () => { limpar(); onOpenChange(false) } },
    )
  }

  const podeSalvar = contaOrigemId !== '' && contaDestinoId !== '' && contaOrigemId !== contaDestinoId && Number(valor) > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Transferência entre Contas</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <select
              value={contaOrigemId}
              onChange={(e) => setContaOrigemId(e.target.value)}
              className="flex-1 h-9 rounded-md border bg-background px-2 text-sm"
            >
              <option value="">Origem</option>
              {(contas ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
            <ArrowRight size={16} className="shrink-0 text-muted-foreground" />
            <select
              value={contaDestinoId}
              onChange={(e) => setContaDestinoId(e.target.value)}
              className="flex-1 h-9 rounded-md border bg-background px-2 text-sm"
            >
              <option value="">Destino</option>
              {(contas ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          {contaOrigemId !== '' && contaOrigemId === contaDestinoId && (
            <p className="text-xs text-destructive">A conta de origem e destino não podem ser iguais.</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Valor</label>
              <CampoMoeda value={valor} onChange={setValor} className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Data</label>
              <input
                type="date"
                value={dataTransferencia}
                onChange={(e) => setDataTransferencia(e.target.value)}
                className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Observações</label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
              className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          <button
            type="button"
            disabled={!podeSalvar || criarTransferencia.isPending}
            onClick={handleSalvar}
            className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
          >
            {criarTransferencia.isPending ? 'Confirmando...' : 'Confirmar Transferência'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
