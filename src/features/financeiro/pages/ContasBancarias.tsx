import { useState } from 'react'
import { Plus, Pencil, ArrowRightLeft } from 'lucide-react'
import { formatCurrency } from '@/utils/format'
import { ROTULO_TIPO_CONTA_BANCARIA, type ContaBancaria } from '@/features/caixa/types/contaBancaria'
import { PermissionGate } from '../components/PermissionGate'
import { ContaBancariaModal } from '../components/ContaBancariaModal'
import { TransferenciaModal } from '../components/TransferenciaModal'
import { useContasBancariasLista, useSaldosContas, useTransferenciasLista } from '../hooks/useContasBancariasFinanceiro'

export function ContasBancarias() {
  const { data: contas, isLoading } = useContasBancariasLista()
  const { data: saldos } = useSaldosContas()
  const { data: transferencias } = useTransferenciasLista()

  const [modalContaAberto, setModalContaAberto] = useState(false)
  const [contaEditando, setContaEditando] = useState<ContaBancaria | null>(null)
  const [modalTransferenciaAberto, setModalTransferenciaAberto] = useState(false)

  function handleNovaConta() {
    setContaEditando(null)
    setModalContaAberto(true)
  }

  function handleEditarConta(conta: ContaBancaria) {
    setContaEditando(conta)
    setModalContaAberto(true)
  }

  const saldoTotal = (contas ?? []).reduce((soma, c) => soma + (saldos?.[c.id] ?? c.saldoInicial), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-semibold">Contas Bancárias</h1>
        <div className="flex items-center gap-2">
          <PermissionGate codigo="financeiro.lancar">
            <button
              type="button"
              onClick={() => setModalTransferenciaAberto(true)}
              className="flex items-center gap-2 h-9 px-4 rounded-md border text-sm font-medium"
            >
              <ArrowRightLeft size={15} /> Transferir
            </button>
          </PermissionGate>
          <PermissionGate codigo="financeiro.lancar">
            <button
              type="button"
              onClick={handleNovaConta}
              className="flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium"
            >
              <Plus size={15} /> Nova Conta
            </button>
          </PermissionGate>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <span className="text-xs text-muted-foreground">Saldo Total</span>
        <p className="text-2xl font-semibold">{formatCurrency(saldoTotal)}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {!isLoading && (contas ?? []).length === 0 && <p className="text-sm text-muted-foreground">Nenhuma conta cadastrada.</p>}
        {(contas ?? []).map((conta) => (
          <div key={conta.id} className={`rounded-lg border p-4 space-y-2 ${!conta.ativo ? 'opacity-50' : ''}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{conta.nome}</p>
                {conta.banco && <p className="text-xs text-muted-foreground">{conta.banco}</p>}
                {conta.tipo && <p className="text-xs text-muted-foreground">{ROTULO_TIPO_CONTA_BANCARIA[conta.tipo]}</p>}
              </div>
              <button type="button" onClick={() => handleEditarConta(conta)} className="p-1.5 rounded hover:bg-muted">
                <Pencil size={14} />
              </button>
            </div>
            {(conta.agencia || conta.conta) && (
              <p className="text-xs text-muted-foreground">
                Ag. {conta.agencia ?? '-'} / Conta {conta.conta ?? '-'}
              </p>
            )}
            {conta.pix && <p className="text-xs text-muted-foreground">PIX: {conta.pix}</p>}
            <p className="text-lg font-semibold">{formatCurrency(saldos?.[conta.id] ?? conta.saldoInicial)}</p>
            {!conta.ativo && <span className="text-xs text-destructive">Inativa</span>}
          </div>
        ))}
      </div>

      {(transferencias ?? []).length > 0 && (
        <div className="rounded-lg border overflow-hidden">
          <div className="p-3 border-b bg-muted/20">
            <h2 className="font-medium text-sm">Últimas Transferências</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-3 py-2">Origem</th>
                <th className="text-left font-medium px-3 py-2">Destino</th>
                <th className="text-right font-medium px-3 py-2">Valor</th>
                <th className="text-left font-medium px-3 py-2">Data</th>
              </tr>
            </thead>
            <tbody>
              {(transferencias ?? []).map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="px-3 py-2">{t.contaOrigemNome}</td>
                  <td className="px-3 py-2">{t.contaDestinoNome}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(t.valor)}</td>
                  <td className="px-3 py-2">{new Date(t.dataTransferencia).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ContaBancariaModal contaEditando={contaEditando} open={modalContaAberto} onOpenChange={setModalContaAberto} />
      <TransferenciaModal open={modalTransferenciaAberto} onOpenChange={setModalTransferenciaAberto} />
    </div>
  )
}
