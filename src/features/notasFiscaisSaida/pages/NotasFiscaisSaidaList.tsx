import { useState } from 'react'
import { ExternalLink, FileText, QrCode, Receipt, RefreshCw, XCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatCurrency } from '@/utils/format'
import { PermissionGate } from '../components/PermissionGate'
import { EmitirNotaFiscalModal } from '../components/EmitirNotaFiscalModal'
import {
  useCancelarNotaFiscal,
  useConsultarStatusNotaFiscal,
  useNotasFiscaisSaida,
  useOrdensPagasParaEmitir,
} from '../hooks/useNotasFiscaisSaida'
import { ROTULO_STATUS_NOTA_FISCAL, type NotaFiscalSaida, type OrdemPagaParaEmitir, type StatusNotaFiscal, type TipoNotaFiscal } from '../types/notaFiscalSaida'

const ROTULO_TIPO_NOTA: Record<TipoNotaFiscal, string> = {
  nfce: 'NFC-e',
  nfe: 'NF-e',
  nfse: 'NFS-e',
}

const COR_STATUS: Record<StatusNotaFiscal, string> = {
  pendente: 'bg-gray-100 text-gray-700',
  processando: 'bg-blue-100 text-blue-700',
  autorizada: 'bg-green-100 text-green-700',
  rejeitada: 'bg-red-100 text-red-700',
  cancelada: 'bg-gray-100 text-gray-500',
  erro: 'bg-red-100 text-red-700',
}

function AbaOsPagas() {
  const { data: ordens, isLoading } = useOrdensPagasParaEmitir()
  const [ordemParaEmitir, setOrdemParaEmitir] = useState<OrdemPagaParaEmitir | null>(null)

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-muted-foreground">
          <tr>
            <th className="text-left font-medium px-3 py-2">OS</th>
            <th className="text-left font-medium px-3 py-2">Cliente</th>
            <th className="text-left font-medium px-3 py-2">Valor</th>
            <th className="text-right font-medium px-3 py-2">Ações</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr>
              <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">Carregando...</td>
            </tr>
          )}
          {!isLoading && (ordens ?? []).length === 0 && (
            <tr>
              <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">Nenhuma OS paga aguardando emissão</td>
            </tr>
          )}
          {(ordens ?? []).map((ordem) => (
            <tr key={ordem.ordemServicoId} className="border-t">
              <td className="px-3 py-2 font-medium">OS {ordem.ordemNumero}</td>
              <td className="px-3 py-2">{ordem.clienteNome ?? '-'}</td>
              <td className="px-3 py-2">{formatCurrency(ordem.valorTotal)}</td>
              <td className="px-3 py-2">
                <div className="flex justify-end">
                  <PermissionGate codigo="notas_fiscais.emitir">
                    <button
                      type="button"
                      onClick={() => setOrdemParaEmitir(ordem)}
                      className="flex items-center gap-1 h-8 px-3 rounded-md border text-xs font-medium"
                    >
                      <Receipt size={13} /> Emitir Nota Fiscal
                    </button>
                  </PermissionGate>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {ordemParaEmitir && (
        <EmitirNotaFiscalModal
          caixaLancamentoId={ordemParaEmitir.caixaLancamentoId}
          ordemServicoId={ordemParaEmitir.ordemServicoId}
          ordemNumero={ordemParaEmitir.ordemNumero}
          open={!!ordemParaEmitir}
          onOpenChange={(open) => !open && setOrdemParaEmitir(null)}
        />
      )}
    </div>
  )
}

function AbaEmitidas() {
  const [filtroStatus, setFiltroStatus] = useState<StatusNotaFiscal | ''>('')
  const { data, isLoading } = useNotasFiscaisSaida({ status: filtroStatus || undefined, pageSize: 50 })
  const consultarStatus = useConsultarStatusNotaFiscal()
  const cancelar = useCancelarNotaFiscal()

  const [notaParaCancelar, setNotaParaCancelar] = useState<NotaFiscalSaida | null>(null)
  const [justificativa, setJustificativa] = useState('')

  function handleCancelar() {
    if (!notaParaCancelar) return
    cancelar.mutate(
      { notaFiscalId: notaParaCancelar.id, justificativa },
      { onSuccess: () => { setNotaParaCancelar(null); setJustificativa('') } },
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(['', 'processando', 'autorizada', 'rejeitada', 'cancelada', 'erro'] as const).map((status) => (
          <button
            key={status || 'todas'}
            type="button"
            onClick={() => setFiltroStatus(status)}
            className={`h-8 px-3 rounded-md text-sm font-medium border ${filtroStatus === status ? 'bg-primary text-primary-foreground border-primary' : 'bg-background'}`}
          >
            {status ? ROTULO_STATUS_NOTA_FISCAL[status] : 'Todas'}
          </button>
        ))}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-3 py-2">Data</th>
              <th className="text-left font-medium px-3 py-2">OS</th>
              <th className="text-left font-medium px-3 py-2">Tipo</th>
              <th className="text-left font-medium px-3 py-2">Cliente</th>
              <th className="text-left font-medium px-3 py-2">Valor</th>
              <th className="text-left font-medium px-3 py-2">Status</th>
              <th className="text-right font-medium px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">Carregando...</td>
              </tr>
            )}
            {!isLoading && (data?.data ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">Nenhuma nota emitida ainda</td>
              </tr>
            )}
            {(data?.data ?? []).map((nota) => (
              <tr key={nota.id} className="border-t">
                <td className="px-3 py-2 text-muted-foreground">{new Date(nota.createdAt).toLocaleString('pt-BR')}</td>
                <td className="px-3 py-2">{nota.ordemNumero ?? '-'}</td>
                <td className="px-3 py-2">{ROTULO_TIPO_NOTA[nota.tipo]}</td>
                <td className="px-3 py-2">{nota.clienteNome ?? '-'}</td>
                <td className="px-3 py-2">{formatCurrency(nota.valorTotal)}</td>
                <td className="px-3 py-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${COR_STATUS[nota.status]}`}>{ROTULO_STATUS_NOTA_FISCAL[nota.status]}</span>
                  {nota.mensagemErro && nota.status !== 'autorizada' && (
                    <p className="text-xs text-destructive mt-0.5 max-w-xs truncate" title={nota.mensagemErro}>{nota.mensagemErro}</p>
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-1">
                    {nota.urlDanfe && (
                      <a href={nota.urlDanfe} target="_blank" rel="noopener noreferrer" title="Ver DANFE" className="h-7 w-7 flex items-center justify-center rounded-md border">
                        <FileText size={13} />
                      </a>
                    )}
                    {nota.urlXml && (
                      <a href={nota.urlXml} target="_blank" rel="noopener noreferrer" title="Baixar XML" className="h-7 w-7 flex items-center justify-center rounded-md border">
                        <ExternalLink size={13} />
                      </a>
                    )}
                    {nota.qrcodeUrl && (
                      <a href={nota.qrcodeUrl} target="_blank" rel="noopener noreferrer" title="QR Code (consulta pelo cliente)" className="h-7 w-7 flex items-center justify-center rounded-md border">
                        <QrCode size={13} />
                      </a>
                    )}
                    {(nota.status === 'processando' || nota.status === 'pendente') && (
                      <button
                        type="button"
                        onClick={() => consultarStatus.mutate(nota.id)}
                        disabled={consultarStatus.isPending}
                        title="Verificar status"
                        className="h-7 w-7 flex items-center justify-center rounded-md border disabled:opacity-50"
                      >
                        <RefreshCw size={13} />
                      </button>
                    )}
                    {nota.status === 'autorizada' && (
                      <PermissionGate codigo="notas_fiscais.cancelar">
                        <button
                          type="button"
                          onClick={() => setNotaParaCancelar(nota)}
                          title="Cancelar nota"
                          className="h-7 w-7 flex items-center justify-center rounded-md border text-destructive"
                        >
                          <XCircle size={13} />
                        </button>
                      </PermissionGate>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!notaParaCancelar} onOpenChange={(open) => !open && setNotaParaCancelar(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancelar Nota Fiscal</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {notaParaCancelar?.tipo === 'nfce'
                ? 'A Sefaz só aceita cancelamento de NFC-e em até 30 minutos após a autorização.'
                : notaParaCancelar?.tipo === 'nfe'
                  ? 'A Sefaz aceita cancelamento de NF-e em até 24 horas após a autorização (pode variar por estado).'
                  : 'O portal nacional de NFS-e pode recusar o cancelamento se o prazo já tiver passado.'}
              {' '}Informe o motivo (entre 15 e 255 caracteres).
            </p>
            <textarea
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              rows={3}
              placeholder="Ex: Venda cancelada a pedido do cliente"
              className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/30"
            />
            <button
              type="button"
              disabled={justificativa.trim().length < 15 || cancelar.isPending}
              onClick={handleCancelar}
              className="w-full h-10 rounded-md bg-destructive text-destructive-foreground text-sm font-medium disabled:opacity-50"
            >
              {cancelar.isPending ? 'Cancelando...' : 'Confirmar Cancelamento'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function NotasFiscaisSaidaList() {
  const [aba, setAba] = useState<'pagas' | 'emitidas'>('pagas')
  const { data: ordensPagas } = useOrdensPagasParaEmitir()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Notas Fiscais</h1>
        <p className="text-sm text-muted-foreground">
          NFC-e/NF-e de peças e NFS-e de serviço (mão de obra), emitidas a partir das vendas recebidas no Caixa.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setAba('pagas')}
          className={`h-9 px-4 rounded-md text-sm font-medium border ${aba === 'pagas' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background'}`}
        >
          OS Pagas p/ Emitir {ordensPagas && ordensPagas.length > 0 ? `(${ordensPagas.length})` : ''}
        </button>
        <button
          type="button"
          onClick={() => setAba('emitidas')}
          className={`h-9 px-4 rounded-md text-sm font-medium border ${aba === 'emitidas' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background'}`}
        >
          Notas Emitidas
        </button>
      </div>

      {aba === 'pagas' ? <AbaOsPagas /> : <AbaEmitidas />}
    </div>
  )
}
