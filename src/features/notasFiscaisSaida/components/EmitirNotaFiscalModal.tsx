import { useEffect, useState } from 'react'
import { AlertTriangle, XOctagon } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatCurrency } from '@/utils/format'
import { buscarOrdemDetalhe } from '@/features/ordens/services/ordemServicoService'
import {
  useDadosFiscaisCliente,
  useEmitirNfse,
  useEmitirNotaFiscal,
  useNotasFiscaisPorLancamento,
  useUltimasTentativasPorLancamento,
} from '../hooks/useNotasFiscaisSaida'
import { ROTULO_STATUS_NOTA_FISCAL } from '../types/notaFiscalSaida'
import { validarClienteParaNota } from '../utils/validacaoDadosFiscais'
import type { OrdemServicoItem } from '@/features/ordens/types/ordemServico'

interface EmitirNotaFiscalModalProps {
  caixaLancamentoId: string
  ordemServicoId: string
  ordemNumero: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Avisa de cadastro incompleto ANTES de deixar emitir, e não deixa a pessoa
// clicar em "Emitir" de novo às cegas quando a última tentativa já rejeitou
// — em vez disso mostra o erro e pede uma confirmação de que o problema foi
// corrigido, pra parar de repetir a mesma tentativa fadada a dar errado de
// novo (isso já aconteceu de verdade nessa oficina: mesma nota, mesmo erro,
// tentada várias vezes seguidas sem perceber que era sempre o mesmo motivo).
function BlocoEmissao({
  titulo,
  itens,
  rotuloValor,
  notaExistente,
  ultimaTentativa,
  problemas,
  emitindo,
  onEmitir,
  observacaoExtra,
}: {
  titulo: string
  itens: OrdemServicoItem[]
  rotuloValor: string
  notaExistente: { status: string } | null | undefined
  ultimaTentativa: { status: string; mensagemErro: string | null; createdAt: string } | null | undefined
  problemas: string[]
  emitindo: boolean
  onEmitir: () => void
  observacaoExtra?: string
}) {
  const [confirmouCorrecao, setConfirmouCorrecao] = useState(false)
  const valorTotal = itens.reduce((soma, item) => soma + item.valorTotal, 0)
  const tentativaFalhou = ultimaTentativa && (ultimaTentativa.status === 'rejeitada' || ultimaTentativa.status === 'erro')

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">{titulo}</h3>

      {itens.length === 0 && <p className="text-sm text-muted-foreground">Essa OS não tem nenhum item desse tipo.</p>}

      {itens.length > 0 && notaExistente && (
        <p className="text-sm">
          Nota já emitida — status: <strong>{ROTULO_STATUS_NOTA_FISCAL[notaExistente.status as keyof typeof ROTULO_STATUS_NOTA_FISCAL]}</strong>.
          Veja detalhes na aba "Notas Emitidas".
        </p>
      )}

      {itens.length > 0 && !notaExistente && (
        <>
          <div className="border rounded-lg divide-y">
            {itens.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <span>
                  {item.descricao}
                  {item.quantidade > 1 ? ` (x${item.quantidade})` : ''}
                </span>
                <span className="font-medium">{formatCurrency(item.valorTotal)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between px-3 py-2 text-sm font-semibold bg-muted/20">
              <span>{rotuloValor}</span>
              <span>{formatCurrency(valorTotal)}</span>
            </div>
          </div>
          {observacaoExtra && <p className="text-xs text-muted-foreground">{observacaoExtra}</p>}

          {problemas.length > 0 ? (
            <div className="rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3 space-y-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                <AlertTriangle size={15} /> Cadastro do cliente incompleto
              </p>
              <p className="text-xs text-amber-800/90 dark:text-amber-400/90">
                A Sefaz vai rejeitar essa nota — falta no cadastro do cliente: <strong>{problemas.join(', ')}</strong>. Complete em Clientes
                antes de emitir.
              </p>
            </div>
          ) : tentativaFalhou ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 space-y-2">
              <p className="text-sm font-medium text-destructive flex items-center gap-1.5">
                <XOctagon size={15} /> A última tentativa dessa nota deu erro
              </p>
              <p className="text-xs text-destructive/90">{ultimaTentativa?.mensagemErro || 'Motivo não informado pela Sefaz/Focus.'}</p>
              <label className="flex items-start gap-2 text-xs pt-1">
                <input
                  type="checkbox"
                  checked={confirmouCorrecao}
                  onChange={(e) => setConfirmouCorrecao(e.target.checked)}
                  className="mt-0.5 size-3.5"
                />
                <span>Já corrigi o problema acima e quero tentar emitir de novo.</span>
              </label>
              <button
                type="button"
                disabled={emitindo || !confirmouCorrecao}
                onClick={onEmitir}
                className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
              >
                {emitindo ? 'Emitindo...' : 'Tentar Emitir Novamente'}
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={emitindo}
              onClick={onEmitir}
              className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
            >
              {emitindo ? 'Emitindo...' : `Emitir ${titulo}`}
            </button>
          )}
        </>
      )}
    </div>
  )
}

export function EmitirNotaFiscalModal({ caixaLancamentoId, ordemServicoId, ordemNumero, open, onOpenChange }: EmitirNotaFiscalModalProps) {
  const [itensPeca, setItensPeca] = useState<OrdemServicoItem[] | null>(null)
  const [itensServico, setItensServico] = useState<OrdemServicoItem[] | null>(null)
  const [clienteId, setClienteId] = useState<string | undefined>(undefined)
  const [carregando, setCarregando] = useState(false)
  const { data: notasExistentes } = useNotasFiscaisPorLancamento(open ? caixaLancamentoId : undefined)
  const { data: ultimasTentativas } = useUltimasTentativasPorLancamento(open ? caixaLancamentoId : undefined)
  const { data: dadosFiscaisCliente } = useDadosFiscaisCliente(open ? clienteId : undefined)
  const emitir = useEmitirNotaFiscal()
  const emitirServico = useEmitirNfse()

  useEffect(() => {
    if (!open) {
      setItensPeca(null)
      setItensServico(null)
      setClienteId(undefined)
      return
    }
    setCarregando(true)
    buscarOrdemDetalhe(ordemServicoId)
      .then((detalhe) => {
        setItensPeca(detalhe.itens.filter((item) => item.tipo === 'produto_estoque' || item.tipo === 'produto_terceirizado'))
        setItensServico(detalhe.itens.filter((item) => item.tipo === 'servico'))
        setClienteId(detalhe.ordem.clienteId)
      })
      .finally(() => setCarregando(false))
  }, [open, ordemServicoId])

  function handleEmitirPecas() {
    emitir.mutate({ caixaLancamentoId, tipo: 'nfe' })
  }

  function handleEmitirServico() {
    emitirServico.mutate(caixaLancamentoId)
  }

  const notaPecaExistente = notasExistentes?.find((n) => n.tipo === 'nfce' || n.tipo === 'nfe')
  const notaServicoExistente = notasExistentes?.find((n) => n.tipo === 'nfse')
  const problemasPeca = validarClienteParaNota(dadosFiscaisCliente, 'peca')
  const problemasServico = validarClienteParaNota(dadosFiscaisCliente, 'servico')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nota Fiscal — OS nº {ordemNumero}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {carregando && <p className="text-sm text-muted-foreground">Carregando itens...</p>}

          {!carregando && itensPeca && (
            <BlocoEmissao
              titulo="Peças (NF-e)"
              itens={itensPeca}
              rotuloValor="Total da nota"
              notaExistente={notaPecaExistente}
              ultimaTentativa={ultimasTentativas?.peca}
              problemas={problemasPeca}
              emitindo={emitir.isPending}
              onEmitir={handleEmitirPecas}
            />
          )}

          {!carregando && itensServico && (
            <div className="border-t pt-4">
              <BlocoEmissao
                titulo="Serviço / Mão de obra (NFS-e)"
                itens={itensServico}
                rotuloValor="Total da NFS-e"
                notaExistente={notaServicoExistente}
                ultimaTentativa={ultimasTentativas?.servico}
                problemas={problemasServico}
                emitindo={emitirServico.isPending}
                onEmitir={handleEmitirServico}
                observacaoExtra="A NFS-e Nacional é sempre assíncrona — depois de enviada, o status é verificado automaticamente na aba 'Notas Emitidas'."
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
