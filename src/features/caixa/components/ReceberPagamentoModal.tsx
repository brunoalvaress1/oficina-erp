import { useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CampoMoeda } from '@/components/ui/CampoMoeda'
import { formatCurrency, formatDate } from '@/utils/format'
import { buscarOrdemDetalhe } from '@/features/ordens/services/ordemServicoService'
import { useConfiguracaoParcelamento } from '@/features/configuracoes/hooks/usePagamentosConfig'
import { useDadosOficina } from '@/features/configuracoes/hooks/useOficina'
import { linhasEnderecoOficina } from '@/features/configuracoes/types/oficina'
import { useReceberPagamento, useMarcarPendente } from '../hooks/useCaixaMutations'
import { FormaPagamentoRow } from './FormaPagamentoRow'
import { ReciboSucesso } from './ReciboSucesso'
import { criarFormaPagamentoVazia, formaPagamentoParaInput, type FormaPagamentoForm } from '../types/formaPagamentoForm'
import type { CaixaLancamento } from '../types/caixa'

interface ReceberPagamentoModalProps {
  lancamento: CaixaLancamento
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReceberPagamentoModal({ lancamento, open, onOpenChange }: ReceberPagamentoModalProps) {
  const [formas, setFormas] = useState<FormaPagamentoForm[]>(() => [criarFormaPagamentoVazia()])
  const [observacoesPendente, setObservacoesPendente] = useState('')
  const [mostrarSucesso, setMostrarSucesso] = useState(false)
  const [descontoTipo, setDescontoTipo] = useState<'percentual' | 'valor'>('percentual')
  const [descontoInput, setDescontoInput] = useState('')

  const receberMutation = useReceberPagamento()
  const marcarPendenteMutation = useMarcarPendente()
  const { data: parcelamento } = useConfiguracaoParcelamento()
  const { data: oficina } = useDadosOficina()

  const descontoValor =
    descontoTipo === 'percentual'
      ? Math.round(((lancamento.valorTotal * (Number(descontoInput) || 0)) / 100) * 100) / 100
      : Math.round((Number(descontoInput) || 0) * 100) / 100
  // Nunca deixa o desconto zerar ou passar do total — evita "pagar" um valor
  // negativo se alguém digitar um desconto maior que a própria OS. Também
  // desconta o que já foi recebido de verdade numa rodada anterior (caso de
  // reabrir um lançamento que ficou com parte pendente) — só cobra o que
  // ainda falta, não a OS inteira de novo.
  const valorAPagar = Math.max(
    0,
    Math.round((lancamento.valorTotal - descontoValor - lancamento.valorRecebidoAcumulado) * 100) / 100,
  )

  const somaFormas = formas.reduce((soma, f) => soma + (Number(f.valor) || 0), 0)
  const somaPendente = formas.filter((f) => f.formaPagamento === 'pendente').reduce((soma, f) => soma + (Number(f.valor) || 0), 0)
  const diferenca = Math.round((valorAPagar - somaFormas) * 100) / 100

  function handleAtualizarForma(chave: string, novaForma: FormaPagamentoForm) {
    setFormas((prev) => prev.map((f) => (f.chave === chave ? novaForma : f)))
  }

  function handleAdicionarForma() {
    setFormas((prev) => {
      const somaAtual = prev.reduce((soma, f) => soma + (Number(f.valor) || 0), 0)
      const restante = Math.round((valorAPagar - somaAtual) * 100) / 100
      const novaForma = criarFormaPagamentoVazia()
      // Já entra preenchida com o que ainda falta pra fechar o total — evita
      // ter que fazer conta de cabeça quando divide o pagamento em mais de
      // uma forma (ex: OS de 1500, já informou 1000 no Pix, a próxima linha
      // já nasce com 500).
      if (restante > 0) novaForma.valor = restante.toFixed(2)
      return [...prev, novaForma]
    })
  }

  function handleRemoverForma(chave: string) {
    setFormas((prev) => (prev.length > 1 ? prev.filter((f) => f.chave !== chave) : prev))
  }

  // Fecha a diferença que falta com uma forma "pendente" — não é dinheiro
  // recebido, só marca que aquele pedaço fica em aberto pra cobrar depois
  // (o lançamento continua/volta pra Pendentes com esse valor).
  function handleDeixarRestantePendente() {
    setFormas((prev) => {
      const somaAtual = prev.reduce((soma, f) => soma + (Number(f.valor) || 0), 0)
      const restante = Math.round((valorAPagar - somaAtual) * 100) / 100
      if (restante <= 0) return prev
      const ultimaVazia = [...prev].reverse().find((f) => !Number(f.valor))
      if (ultimaVazia) {
        return prev.map((f) => (f.chave === ultimaVazia.chave ? { ...f, formaPagamento: 'pendente', valor: restante.toFixed(2) } : f))
      }
      const novaForma = criarFormaPagamentoVazia('pendente')
      novaForma.valor = restante.toFixed(2)
      return [...prev, novaForma]
    })
  }

  function handleReceber() {
    if (diferenca !== 0) return
    const formasInput = formas.map((forma) =>
      formaPagamentoParaInput(forma, parcelamento?.parcelasSemJuros ?? 6, parcelamento?.jurosPercentual ?? 8),
    )
    receberMutation.mutate(
      { caixaLancamentoId: lancamento.id, formas: formasInput, desconto: descontoValor },
      { onSuccess: () => setMostrarSucesso(true) },
    )
  }

  function handleMarcarPendente() {
    marcarPendenteMutation.mutate(
      { caixaLancamentoId: lancamento.id, observacoes: observacoesPendente || undefined },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  async function handleImprimir() {
    try {
      const [detalhe, { gerarEAbrirPdfOrdem }] = await Promise.all([
        buscarOrdemDetalhe(lancamento.ordemServicoId),
        import('@/features/ordens/components/DocumentoOrdemPdf'),
      ])
      await gerarEAbrirPdfOrdem(detalhe.ordem, detalhe.itens, 'os', {
        cnpj: oficina?.cnpj,
        enderecoLinhas: linhasEnderecoOficina(oficina),
        telefone: oficina?.telefone,
        email: oficina?.email,
        logoUrl: oficina?.logoUrl,
        rodape: oficina?.rodapeImpressao,
      })
    } catch (error) {
      toast.error('Erro ao gerar PDF', { description: error instanceof Error ? error.message : String(error) })
    }
  }

  function handleFecharTudo() {
    setMostrarSucesso(false)
    setFormas([criarFormaPagamentoVazia()])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        {mostrarSucesso ? (
          <ReciboSucesso
            numeroOrdem={lancamento.ordemNumero}
            valorTotal={somaFormas - somaPendente}
            valorPendente={somaPendente}
            onImprimir={handleImprimir}
            onFechar={handleFecharTudo}
          />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Receber OS nº {lancamento.ordemNumero}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-lg border p-3 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <Campo label="Cliente" valor={lancamento.clienteNome} />
                <Campo label="Veículo" valor={lancamento.veiculoModelo} />
                <Campo label="Placa" valor={lancamento.veiculoPlaca} />
                <Campo label="Responsável" valor={lancamento.responsavelNome} />
                <Campo label="Data" valor={formatDate(lancamento.dataAbertura)} />
                <Campo label="Desconto (itens)" valor={formatCurrency(lancamento.valorDesconto)} />
                <Campo label="Valor Total" valor={formatCurrency(lancamento.valorTotal)} destaque />
                {lancamento.valorRecebidoAcumulado > 0 && (
                  <>
                    <Campo label="Já recebido" valor={formatCurrency(lancamento.valorRecebidoAcumulado)} />
                    <Campo label="Falta receber" valor={formatCurrency(valorAPagar)} destaque />
                  </>
                )}
              </div>

              <div className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Desconto no pagamento</span>
                  <div className="flex rounded-md border overflow-hidden text-xs">
                    <button
                      type="button"
                      onClick={() => setDescontoTipo('percentual')}
                      className={`px-3 h-7 font-medium transition-colors ${
                        descontoTipo === 'percentual' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
                      }`}
                    >
                      %
                    </button>
                    <button
                      type="button"
                      onClick={() => setDescontoTipo('valor')}
                      className={`px-3 h-7 font-medium border-l transition-colors ${
                        descontoTipo === 'valor' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
                      }`}
                    >
                      R$
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {descontoTipo === 'percentual' ? (
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      value={descontoInput}
                      onChange={(e) => setDescontoInput(e.target.value)}
                      placeholder="0"
                      className="w-28 h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30"
                    />
                  ) : (
                    <CampoMoeda
                      value={descontoInput}
                      onChange={setDescontoInput}
                      className="w-32 h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30"
                    />
                  )}
                  {descontoValor > 0 && (
                    <span className="text-sm text-muted-foreground">
                      -{formatCurrency(descontoValor)} · Valor a pagar:{' '}
                      <span className="font-semibold text-foreground">{formatCurrency(valorAPagar)}</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Forma de Pagamento</h3>
                  <button
                    type="button"
                    onClick={handleAdicionarForma}
                    className="flex items-center gap-1 h-8 px-3 rounded-md border text-xs font-medium"
                  >
                    <Plus size={14} /> Adicionar Forma de Pagamento
                  </button>
                </div>

                {formas.map((forma) => (
                  <FormaPagamentoRow
                    key={forma.chave}
                    forma={forma}
                    onChange={(nova) => handleAtualizarForma(forma.chave, nova)}
                    onRemover={() => handleRemoverForma(forma.chave)}
                    podeRemover={formas.length > 1}
                  />
                ))}
              </div>

              <div className="rounded-lg border p-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total informado {descontoValor > 0 ? `(de ${formatCurrency(valorAPagar)} a pagar)` : ''}
                  {somaPendente > 0 && ` · ${formatCurrency(somaPendente)} ficará pendente`}
                </span>
                <span className="text-base font-semibold">{formatCurrency(somaFormas)}</span>
              </div>

              {diferenca > 0 && (
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-sm text-amber-600">Ainda falta {formatCurrency(diferenca)} para completar o pagamento.</p>
                  <button
                    type="button"
                    onClick={handleDeixarRestantePendente}
                    className="h-8 px-3 rounded-md border text-xs font-medium text-amber-700 border-amber-300 hover:bg-amber-50"
                  >
                    Deixar {formatCurrency(diferenca)} pendente
                  </button>
                </div>
              )}
              {diferenca < 0 && (
                <p className="text-sm text-destructive">O valor informado ultrapassa o valor da ordem em {formatCurrency(-diferenca)}.</p>
              )}

              <button
                type="button"
                onClick={handleReceber}
                disabled={diferenca !== 0 || receberMutation.isPending}
                className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
              >
                {receberMutation.isPending
                  ? 'Recebendo...'
                  : somaPendente > 0
                    ? `Receber ${formatCurrency(somaFormas - somaPendente)} e Deixar Restante Pendente`
                    : 'Receber'}
              </button>

              {lancamento.status === 'aguardando' && (
                <div className="border-t pt-3 space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Ou mover para Pendentes (observação opcional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={observacoesPendente}
                      onChange={(e) => setObservacoesPendente(e.target.value)}
                      placeholder="Observação..."
                      className="flex-1 h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30"
                    />
                    <button
                      type="button"
                      onClick={handleMarcarPendente}
                      disabled={marcarPendenteMutation.isPending}
                      className="h-9 px-4 rounded-md border text-sm font-medium disabled:opacity-50"
                    >
                      {marcarPendenteMutation.isPending ? 'Movendo...' : 'Marcar como Pendente'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Campo({ label, valor, destaque }: { label: string; valor: string | null; destaque?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={destaque ? 'font-semibold' : ''}>{valor ?? '-'}</p>
    </div>
  )
}
