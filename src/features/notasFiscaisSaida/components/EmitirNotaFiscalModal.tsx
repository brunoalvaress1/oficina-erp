import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatCurrency } from '@/utils/format'
import { buscarOrdemDetalhe } from '@/features/ordens/services/ordemServicoService'
import { useEmitirNfse, useEmitirNotaFiscal, useNotasFiscaisPorLancamento } from '../hooks/useNotasFiscaisSaida'
import { ROTULO_STATUS_NOTA_FISCAL } from '../types/notaFiscalSaida'
import type { OrdemServicoItem } from '@/features/ordens/types/ordemServico'

interface EmitirNotaFiscalModalProps {
  caixaLancamentoId: string
  ordemServicoId: string
  ordemNumero: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EmitirNotaFiscalModal({ caixaLancamentoId, ordemServicoId, ordemNumero, open, onOpenChange }: EmitirNotaFiscalModalProps) {
  const [itensPeca, setItensPeca] = useState<OrdemServicoItem[] | null>(null)
  const [itensServico, setItensServico] = useState<OrdemServicoItem[] | null>(null)
  const [carregando, setCarregando] = useState(false)
  const { data: notasExistentes } = useNotasFiscaisPorLancamento(open ? caixaLancamentoId : undefined)
  const emitir = useEmitirNotaFiscal()
  const emitirServico = useEmitirNfse()

  useEffect(() => {
    if (!open) {
      setItensPeca(null)
      setItensServico(null)
      return
    }
    setCarregando(true)
    buscarOrdemDetalhe(ordemServicoId)
      .then((detalhe) => {
        setItensPeca(detalhe.itens.filter((item) => item.tipo === 'produto_estoque' || item.tipo === 'produto_terceirizado'))
        setItensServico(detalhe.itens.filter((item) => item.tipo === 'servico'))
      })
      .finally(() => setCarregando(false))
  }, [open, ordemServicoId])

  function handleEmitirPecas() {
    emitir.mutate({ caixaLancamentoId, tipo: 'nfe' })
  }

  function handleEmitirServico() {
    emitirServico.mutate(caixaLancamentoId)
  }

  const valorTotalPecas = (itensPeca ?? []).reduce((soma, item) => soma + item.valorTotal, 0)
  const valorTotalServico = (itensServico ?? []).reduce((soma, item) => soma + item.valorTotal, 0)
  const notaPecaExistente = notasExistentes?.find((n) => n.tipo === 'nfce' || n.tipo === 'nfe')
  const notaServicoExistente = notasExistentes?.find((n) => n.tipo === 'nfse')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nota Fiscal — OS nº {ordemNumero}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {carregando && <p className="text-sm text-muted-foreground">Carregando itens...</p>}

          {!carregando && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Peças (NF-e)</h3>

              {itensPeca && itensPeca.length === 0 && (
                <p className="text-sm text-muted-foreground">Essa OS não tem nenhum item de peça.</p>
              )}

              {itensPeca && itensPeca.length > 0 && notaPecaExistente && (
                <p className="text-sm">
                  Nota de peças já emitida — status: <strong>{ROTULO_STATUS_NOTA_FISCAL[notaPecaExistente.status]}</strong>. Veja
                  detalhes e o DANFE na aba "Notas Emitidas".
                </p>
              )}

              {itensPeca && itensPeca.length > 0 && !notaPecaExistente && (
                <>
                  <div className="border rounded-lg divide-y">
                    {itensPeca.map((item) => (
                      <div key={item.id} className="flex items-center justify-between px-3 py-2 text-sm">
                        <span>{item.descricao} (x{item.quantidade})</span>
                        <span className="font-medium">{formatCurrency(item.valorTotal)}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between px-3 py-2 text-sm font-semibold bg-muted/20">
                      <span>Total da nota</span>
                      <span>{formatCurrency(valorTotalPecas)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={emitir.isPending}
                    onClick={handleEmitirPecas}
                    className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                  >
                    {emitir.isPending ? 'Emitindo...' : 'Emitir Nota Fiscal de Peças'}
                  </button>
                </>
              )}
            </div>
          )}

          {!carregando && (
            <div className="space-y-3 border-t pt-4">
              <h3 className="text-sm font-semibold">Serviço / Mão de obra (NFS-e)</h3>

              {itensServico && itensServico.length === 0 && (
                <p className="text-sm text-muted-foreground">Essa OS não tem nenhum item de serviço.</p>
              )}

              {itensServico && itensServico.length > 0 && notaServicoExistente && (
                <p className="text-sm">
                  NFS-e já emitida — status: <strong>{ROTULO_STATUS_NOTA_FISCAL[notaServicoExistente.status]}</strong>. Veja
                  detalhes na aba "Notas Emitidas".
                </p>
              )}

              {itensServico && itensServico.length > 0 && !notaServicoExistente && (
                <>
                  <div className="border rounded-lg divide-y">
                    {itensServico.map((item) => (
                      <div key={item.id} className="flex items-center justify-between px-3 py-2 text-sm">
                        <span>{item.descricao}</span>
                        <span className="font-medium">{formatCurrency(item.valorTotal)}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between px-3 py-2 text-sm font-semibold bg-muted/20">
                      <span>Total da NFS-e</span>
                      <span>{formatCurrency(valorTotalServico)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    A NFS-e Nacional é sempre assíncrona — depois de enviada, use "Verificar status" na lista de notas emitidas.
                  </p>
                  <button
                    type="button"
                    disabled={emitirServico.isPending}
                    onClick={handleEmitirServico}
                    className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                  >
                    {emitirServico.isPending ? 'Enviando...' : 'Emitir NFS-e de Serviço'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
