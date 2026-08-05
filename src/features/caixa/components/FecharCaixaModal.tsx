import { useState } from 'react'
import { toast } from 'sonner'
import { Download, Printer } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatCurrency } from '@/utils/format'
import { useDadosOficina } from '@/features/configuracoes/hooks/useOficina'
import { linhasEnderecoOficina } from '@/features/configuracoes/types/oficina'
import { useResumoSessaoCaixa, useFecharCaixa } from '../hooks/useCaixaSessao'

interface FecharCaixaModalProps {
  caixaSessaoId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FecharCaixaModal({ caixaSessaoId, open, onOpenChange }: FecharCaixaModalProps) {
  const [observacoes, setObservacoes] = useState('')
  const [processandoPdf, setProcessandoPdf] = useState<'baixar' | 'imprimir' | null>(null)
  const { data: resumo, isLoading } = useResumoSessaoCaixa(open ? caixaSessaoId : undefined)
  const fecharMutation = useFecharCaixa()
  const { data: oficina } = useDadosOficina()

  async function handleBaixarPdf() {
    if (!resumo) return
    setProcessandoPdf('baixar')
    try {
      const { gerarEBaixarPdfFechamento } = await import('./DocumentoFechamentoCaixaPdf')
      await gerarEBaixarPdfFechamento(resumo, {
        enderecoLinhas: linhasEnderecoOficina(oficina),
        telefone: oficina?.telefone,
        email: oficina?.email,
        logoUrl: oficina?.logoUrl,
        rodape: oficina?.rodapeImpressao,
      })
    } catch (error) {
      toast.error('Erro ao gerar PDF', { description: error instanceof Error ? error.message : String(error) })
    } finally {
      setProcessandoPdf(null)
    }
  }

  async function handleImprimir() {
    if (!resumo) return
    setProcessandoPdf('imprimir')
    try {
      const { gerarEAbrirPdfFechamento } = await import('./DocumentoFechamentoCaixaPdf')
      await gerarEAbrirPdfFechamento(resumo, {
        enderecoLinhas: linhasEnderecoOficina(oficina),
        telefone: oficina?.telefone,
        email: oficina?.email,
        logoUrl: oficina?.logoUrl,
        rodape: oficina?.rodapeImpressao,
      })
    } catch (error) {
      toast.error('Erro ao gerar PDF', { description: error instanceof Error ? error.message : String(error) })
    } finally {
      setProcessandoPdf(null)
    }
  }

  function handleFechar() {
    fecharMutation.mutate({ caixaSessaoId, observacoes: observacoes || undefined }, { onSuccess: () => onOpenChange(false) })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fechar Caixa</DialogTitle>
        </DialogHeader>

        {isLoading || !resumo ? (
          <p className="text-sm text-muted-foreground">Carregando resumo...</p>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border p-3 space-y-2 text-sm">
              <Linha label="Valor de Abertura" valor={formatCurrency(resumo.sessao.valorAbertura)} />
              <Linha label="Dinheiro" valor={formatCurrency(resumo.totalDinheiro)} />
              <Linha label="PIX" valor={formatCurrency(resumo.totalPix)} />
              <Linha label="Débito" valor={formatCurrency(resumo.totalDebito)} />
              <Linha label="Crédito" valor={formatCurrency(resumo.totalCredito)} />
              <Linha label="Transferência" valor={formatCurrency(resumo.totalTransferencia)} />
              <Linha label="Cheque" valor={formatCurrency(resumo.totalCheque)} />
              <Linha label="Crediário" valor={formatCurrency(resumo.totalCrediario)} />
              <Linha label="Boleto" valor={formatCurrency(resumo.totalBoleto)} />
              <Linha label="Outros" valor={formatCurrency(resumo.totalOutros)} />
              <div className="border-t pt-2">
                <Linha label="Valor esperado em dinheiro" valor={formatCurrency(resumo.valorEsperadoDinheiro)} />
              </div>
              <div className="border-t pt-2">
                <Linha label={`Total Geral (${resumo.quantidadeRecebimentos} recebimentos)`} valor={formatCurrency(resumo.totalGeral)} destaque />
              </div>
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

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleBaixarPdf}
                disabled={processandoPdf !== null}
                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-md border text-sm font-medium disabled:opacity-50"
              >
                <Download size={15} /> {processandoPdf === 'baixar' ? 'Gerando...' : 'Salvar PDF'}
              </button>
              <button
                type="button"
                onClick={handleImprimir}
                disabled={processandoPdf !== null}
                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-md border text-sm font-medium disabled:opacity-50"
              >
                <Printer size={15} /> {processandoPdf === 'imprimir' ? 'Gerando...' : 'Imprimir'}
              </button>
            </div>

            <button
              type="button"
              onClick={handleFechar}
              disabled={fecharMutation.isPending}
              className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
            >
              {fecharMutation.isPending ? 'Fechando...' : 'Confirmar Fechamento'}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Linha({ label, valor, destaque }: { label: string; valor: string; destaque?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={destaque ? 'font-semibold text-base' : ''}>{valor}</span>
    </div>
  )
}
