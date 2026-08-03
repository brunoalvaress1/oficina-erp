import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CampoMoeda } from '@/components/ui/CampoMoeda'
import type { ContaBancaria, TipoContaBancaria } from '@/features/caixa/types/contaBancaria'
import { ROTULO_TIPO_CONTA_BANCARIA } from '@/features/caixa/types/contaBancaria'
import { useAtualizarContaBancaria, useCriarContaBancaria } from '../hooks/useContasBancariasFinanceiro'

const TIPOS: TipoContaBancaria[] = ['corrente', 'poupanca', 'caixa_fisico', 'conta_digital', 'outro']

interface ContaBancariaModalProps {
  contaEditando: ContaBancaria | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ContaBancariaModal({ contaEditando, open, onOpenChange }: ContaBancariaModalProps) {
  const [nome, setNome] = useState('')
  const [banco, setBanco] = useState('')
  const [agencia, setAgencia] = useState('')
  const [conta, setConta] = useState('')
  const [pix, setPix] = useState('')
  const [tipo, setTipo] = useState<TipoContaBancaria>('corrente')
  const [saldoInicial, setSaldoInicial] = useState('')
  const [saldoMinimoAlerta, setSaldoMinimoAlerta] = useState('')
  const [ativo, setAtivo] = useState(true)

  const criar = useCriarContaBancaria()
  const atualizar = useAtualizarContaBancaria()

  useEffect(() => {
    if (contaEditando) {
      setNome(contaEditando.nome)
      setBanco(contaEditando.banco ?? '')
      setAgencia(contaEditando.agencia ?? '')
      setConta(contaEditando.conta ?? '')
      setPix(contaEditando.pix ?? '')
      setTipo(contaEditando.tipo ?? 'corrente')
      setSaldoInicial(contaEditando.saldoInicial ? String(contaEditando.saldoInicial) : '')
      setSaldoMinimoAlerta(contaEditando.saldoMinimoAlerta != null ? String(contaEditando.saldoMinimoAlerta) : '')
      setAtivo(contaEditando.ativo)
    } else {
      setNome('')
      setBanco('')
      setAgencia('')
      setConta('')
      setPix('')
      setTipo('corrente')
      setSaldoInicial('')
      setSaldoMinimoAlerta('')
      setAtivo(true)
    }
  }, [contaEditando, open])

  function handleSalvar() {
    const input = {
      nome,
      banco: banco || undefined,
      agencia: agencia || undefined,
      conta: conta || undefined,
      pix: pix || undefined,
      tipo,
      saldoInicial: Number(saldoInicial) || 0,
      saldoMinimoAlerta: saldoMinimoAlerta ? Number(saldoMinimoAlerta) : null,
      ativo,
    }

    if (contaEditando) {
      atualizar.mutate({ id: contaEditando.id, input }, { onSuccess: () => onOpenChange(false) })
    } else {
      criar.mutate(input, { onSuccess: () => onOpenChange(false) })
    }
  }

  const salvando = criar.isPending || atualizar.isPending
  const podeSalvar = nome.trim() !== ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{contaEditando ? 'Editar Conta Bancária' : 'Nova Conta Bancária'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Nome *</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Banco Inter, Caixa Físico, Mercado Pago..."
              className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Banco</label>
              <input type="text" value={banco} onChange={(e) => setBanco(e.target.value)} className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Tipo</label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoContaBancaria)} className="w-full h-9 rounded-md border bg-background px-2 text-sm">
                {TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {ROTULO_TIPO_CONTA_BANCARIA[t]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Agência</label>
              <input type="text" value={agencia} onChange={(e) => setAgencia(e.target.value)} className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Conta</label>
              <input type="text" value={conta} onChange={(e) => setConta(e.target.value)} className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Chave PIX</label>
            <input type="text" value={pix} onChange={(e) => setPix(e.target.value)} className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Saldo Inicial</label>
              <CampoMoeda value={saldoInicial} onChange={setSaldoInicial} className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Alerta de Saldo Baixo</label>
              <CampoMoeda value={saldoMinimoAlerta} onChange={setSaldoMinimoAlerta} className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30" />
            </div>
          </div>

          {contaEditando && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
              Conta ativa
            </label>
          )}

          <button
            type="button"
            disabled={!podeSalvar || salvando}
            onClick={handleSalvar}
            className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
          >
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
