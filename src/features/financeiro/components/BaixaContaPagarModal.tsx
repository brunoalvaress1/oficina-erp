import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CampoMoeda } from '@/components/ui/CampoMoeda'
import { Combobox } from '@/components/ui/Combobox'
import { formatCurrency } from '@/utils/format'
import { ROTULO_FORMA_PAGAMENTO, type FormaPagamento } from '@/features/caixa/types/caixa'
import { buscarContasBancarias, criarContaBancaria } from '@/features/caixa/services/contaBancariaService'
import type { ContaBancaria } from '@/features/caixa/types/contaBancaria'
import { usePermissions } from '@/hooks/usePermissions'
import { useBaixarContaPagar } from '../hooks/useContasPagar'
import type { ContaPagar } from '../types/contaPagar'

const FORMAS: FormaPagamento[] = ['dinheiro', 'pix', 'debito', 'credito', 'transferencia', 'cheque', 'crediario', 'boleto', 'outros']

interface BaixaContaPagarModalProps {
  conta: ContaPagar | null
  onOpenChange: (open: boolean) => void
}

export function BaixaContaPagarModal({ conta, onOpenChange }: BaixaContaPagarModalProps) {
  const { funcionario } = usePermissions()
  const restante = conta ? conta.valor - conta.valorPago : 0

  const [valor, setValor] = useState('')
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('dinheiro')
  const [conta_, setConta_] = useState<ContaBancaria | null>(null)
  const [contasBusca, setContasBusca] = useState<ContaBancaria[]>([])
  const [carregandoContas, setCarregandoContas] = useState(false)
  const [dataPagamento, setDataPagamento] = useState(() => new Date().toISOString().slice(0, 10))
  const [observacoes, setObservacoes] = useState('')

  const baixar = useBaixarContaPagar()

  useEffect(() => {
    if (conta) setValor(restante > 0 ? restante.toFixed(2) : '')
  }, [conta, restante])

  async function handleBuscarContas(termo: string) {
    setCarregandoContas(true)
    try {
      setContasBusca(await buscarContasBancarias(termo))
    } finally {
      setCarregandoContas(false)
    }
  }

  function handleSalvar() {
    if (!conta) return
    baixar.mutate(
      {
        contaPagarId: conta.id,
        valor: Number(valor) || 0,
        contaBancariaId: conta_?.id,
        formaPagamento,
        dataPagamento,
        observacoes: observacoes || undefined,
      },
      {
        onSuccess: () => {
          setValor('')
          setObservacoes('')
          onOpenChange(false)
        },
      },
    )
  }

  const podeSalvar = Number(valor) > 0 && Number(valor) <= restante + 0.009

  return (
    <Dialog open={!!conta} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pagar — {conta?.descricao}</DialogTitle>
        </DialogHeader>

        {conta && (
          <div className="space-y-3">
            <div className="rounded-md border p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span>{formatCurrency(conta.valor)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Já pago</span>
                <span>{formatCurrency(conta.valorPago)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Restante</span>
                <span>{formatCurrency(restante)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Valor a pagar</label>
                <CampoMoeda value={valor} onChange={setValor} className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Data</label>
                <input
                  type="date"
                  value={dataPagamento}
                  onChange={(e) => setDataPagamento(e.target.value)}
                  className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Forma de Pagamento</label>
              <select
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value as FormaPagamento)}
                className="w-full h-9 rounded-md border bg-background px-3 text-sm"
              >
                {FORMAS.map((forma) => (
                  <option key={forma} value={forma}>
                    {ROTULO_FORMA_PAGAMENTO[forma]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Conta Bancária</label>
              <Combobox
                value={conta_}
                onSelect={setConta_}
                onSearch={handleBuscarContas}
                items={contasBusca}
                isLoading={carregandoContas}
                getKey={(c) => c.id}
                getLabel={(c) => c.nome}
                onCriarNovo={(termo) => criarContaBancaria(termo, funcionario!.oficinaId).then(setConta_)}
              />
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
              disabled={!podeSalvar || baixar.isPending}
              onClick={handleSalvar}
              className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
            >
              {baixar.isPending ? 'Salvando...' : 'Confirmar Pagamento'}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
