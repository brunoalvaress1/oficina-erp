import { useMemo, useState } from 'react'
import { ExternalLink, FileCheck2, FileText, Hourglass, QrCode, Receipt, RefreshCw, Wallet, XCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatCurrency } from '@/utils/format'
import { CardIndicador } from '@/features/financeiro/components/CardIndicador'
import { calcularIntervaloPeriodo, ROTULO_PERIODO_FINANCEIRO, type PeriodoFinanceiro } from '@/features/financeiro/types/filtroFinanceiro'
import { PermissionGate } from '../components/PermissionGate'
import { EmitirNotaFiscalModal } from '../components/EmitirNotaFiscalModal'
import {
  useCancelarNotaFiscal,
  useConsultarStatusNotaFiscal,
  useEmitirNotasEmLote,
  useNotasFiscaisSaida,
  useOrdensPagasParaEmitir,
  useResumoNotasFiscais,
} from '../hooks/useNotasFiscaisSaida'
import {
  ROTULO_STATUS_NOTA_FISCAL,
  type ModeloNotaFiscal,
  type NotaFiscalSaida,
  type OrdemPagaParaEmitir,
  type StatusNotaFiscal,
  type TipoNotaFiscal,
} from '../types/notaFiscalSaida'

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

// "Todas" não existe nos períodos do Financeiro (lá sempre tem um período
// ativo) — aqui faz diferença: filtrar por período por padrão esconderia
// silenciosamente OS pagas antigas ainda pendentes de emitir, então o filtro
// de data começa desligado nas duas abas e é opt-in.
type PeriodoNotas = 'todas' | PeriodoFinanceiro

const PERIODOS_NOTAS: PeriodoNotas[] = ['todas', 'hoje', 'ultimos_7_dias', 'ultimos_30_dias', 'este_mes', 'mes_anterior', 'este_ano', 'personalizado']

interface FiltroPeriodoState {
  periodo: PeriodoNotas
  dataInicio: string
  dataFim: string
}

function filtroPeriodoPadrao(): FiltroPeriodoState {
  return { periodo: 'todas', dataInicio: '', dataFim: '' }
}

function FiltroPeriodoNotas({ valor, onChange }: { valor: FiltroPeriodoState; onChange: (valor: FiltroPeriodoState) => void }) {
  function handlePeriodo(periodo: PeriodoNotas) {
    if (periodo === 'todas' || periodo === 'personalizado') {
      onChange({ periodo, dataInicio: periodo === 'todas' ? '' : valor.dataInicio, dataFim: periodo === 'todas' ? '' : valor.dataFim })
      return
    }
    onChange({ periodo, ...calcularIntervaloPeriodo(periodo) })
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {PERIODOS_NOTAS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => handlePeriodo(p)}
            className={`h-8 px-3 rounded-full text-xs font-medium border ${valor.periodo === p ? 'bg-primary text-primary-foreground border-primary' : 'bg-background'}`}
          >
            {p === 'todas' ? 'Todas' : ROTULO_PERIODO_FINANCEIRO[p]}
          </button>
        ))}
      </div>
      {valor.periodo === 'personalizado' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={valor.dataInicio}
            onChange={(e) => onChange({ ...valor, dataInicio: e.target.value })}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          />
          <span className="text-sm text-muted-foreground">até</span>
          <input
            type="date"
            value={valor.dataFim}
            onChange={(e) => onChange({ ...valor, dataFim: e.target.value })}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          />
        </div>
      )}
    </div>
  )
}

function dataDentroDoIntervalo(data: string | null, dataInicio: string, dataFim: string): boolean {
  if (!data) return false
  const instante = new Date(data).getTime()
  if (dataInicio && instante < new Date(`${dataInicio}T00:00:00`).getTime()) return false
  if (dataFim && instante > new Date(`${dataFim}T23:59:59`).getTime()) return false
  return true
}

const ROTULO_MODELO: Record<ModeloNotaFiscal, string> = {
  peca: 'Peças (NF-e)',
  servico: 'Serviço (NFS-e)',
}

function AbaOsPagas() {
  const { data: ordens, isLoading } = useOrdensPagasParaEmitir()
  const [ordemParaEmitir, setOrdemParaEmitir] = useState<OrdemPagaParaEmitir | null>(null)
  const [filtro, setFiltro] = useState<FiltroPeriodoState>(filtroPeriodoPadrao())
  const [modeloSelecao, setModeloSelecao] = useState<ModeloNotaFiscal>('peca')
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set())
  const emitirEmLote = useEmitirNotasEmLote()

  const ordensFiltradas = useMemo(() => {
    const lista = ordens ?? []
    if (filtro.periodo === 'todas') return lista
    return lista.filter((ordem) => dataDentroDoIntervalo(ordem.dataPagamento, filtro.dataInicio, filtro.dataFim))
  }, [ordens, filtro])

  const valorTotal = ordensFiltradas.reduce((soma, ordem) => soma + ordem.valorTotal, 0)

  // Só entram na seleção em lote as OS que realmente têm aquele modelo
  // pendente — uma OS só de serviço não aparece com checkbox no modo "Peças".
  const ordensSelecionaveis = useMemo(
    () => ordensFiltradas.filter((ordem) => (modeloSelecao === 'peca' ? ordem.pecaPendente : ordem.servicoPendente)),
    [ordensFiltradas, modeloSelecao],
  )
  const idsSelecionaveis = useMemo(() => new Set(ordensSelecionaveis.map((o) => o.ordemServicoId)), [ordensSelecionaveis])

  function alternarModelo(modelo: ModeloNotaFiscal) {
    setModeloSelecao(modelo)
    setSelecionadas(new Set())
  }

  function alternarSelecao(ordemServicoId: string) {
    setSelecionadas((atual) => {
      const novo = new Set(atual)
      if (novo.has(ordemServicoId)) novo.delete(ordemServicoId)
      else novo.add(ordemServicoId)
      return novo
    })
  }

  function alternarSelecionarTodas() {
    setSelecionadas((atual) => {
      const todasSelecionadas = ordensSelecionaveis.length > 0 && ordensSelecionaveis.every((o) => atual.has(o.ordemServicoId))
      return todasSelecionadas ? new Set() : new Set(idsSelecionaveis)
    })
  }

  const ordensParaEmitirLote = ordensSelecionaveis.filter((o) => selecionadas.has(o.ordemServicoId))
  const valorSelecionado = ordensParaEmitirLote.reduce(
    (soma, o) => soma + (modeloSelecao === 'peca' ? o.valorPecas : o.valorServicos),
    0,
  )

  function handleEmitirLote() {
    emitirEmLote.mutate(
      {
        itens: ordensParaEmitirLote.map((o) => ({ caixaLancamentoId: o.caixaLancamentoId, ordemNumero: o.ordemNumero })),
        modelo: modeloSelecao,
      },
      { onSuccess: () => setSelecionadas(new Set()) },
    )
  }

  return (
    <div className="space-y-3">
      <FiltroPeriodoNotas valor={filtro} onChange={setFiltro} />

      <div className="grid grid-cols-2 gap-3 max-w-md">
        <CardIndicador titulo="OS aguardando emissão" valor={String(ordensFiltradas.length)} icone={<Hourglass size={15} />} />
        <CardIndicador titulo="Valor total" valor={formatCurrency(valorTotal)} icone={<Wallet size={15} />} />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Selecionar modelo para emitir em lote:</span>
        {(['peca', 'servico'] as const).map((modelo) => (
          <button
            key={modelo}
            type="button"
            onClick={() => alternarModelo(modelo)}
            className={`h-8 px-3 rounded-md text-xs font-medium border ${modeloSelecao === modelo ? 'bg-primary text-primary-foreground border-primary' : 'bg-background'}`}
          >
            {ROTULO_MODELO[modelo]}
          </button>
        ))}
      </div>

      {selecionadas.size > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-lg border bg-primary/5 px-4 py-3">
          <div className="text-sm">
            <span className="font-semibold">{selecionadas.size}</span> nota{selecionadas.size === 1 ? '' : 's'} de{' '}
            <strong>{ROTULO_MODELO[modeloSelecao]}</strong> selecionada{selecionadas.size === 1 ? '' : 's'} · Valor total:{' '}
            <span className="font-semibold">{formatCurrency(valorSelecionado)}</span>
          </div>
          <PermissionGate codigo="notas_fiscais.emitir">
            <button
              type="button"
              onClick={handleEmitirLote}
              disabled={emitirEmLote.isPending}
              className="flex items-center gap-1.5 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
            >
              <Receipt size={14} />
              {emitirEmLote.isPending ? 'Emitindo...' : `Emitir ${selecionadas.size} selecionada${selecionadas.size === 1 ? '' : 's'}`}
            </button>
          </PermissionGate>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 w-8">
                <input
                  type="checkbox"
                  checked={ordensSelecionaveis.length > 0 && ordensSelecionaveis.every((o) => selecionadas.has(o.ordemServicoId))}
                  onChange={alternarSelecionarTodas}
                  disabled={ordensSelecionaveis.length === 0}
                  className="size-4"
                />
              </th>
              <th className="text-left font-medium px-3 py-2">OS</th>
              <th className="text-left font-medium px-3 py-2">Cliente</th>
              <th className="text-left font-medium px-3 py-2">Pago em</th>
              <th className="text-left font-medium px-3 py-2">Valor</th>
              <th className="text-right font-medium px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">Carregando...</td>
              </tr>
            )}
            {!isLoading && ordensFiltradas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                  {filtro.periodo === 'todas' ? 'Nenhuma OS paga aguardando emissão' : 'Nenhuma OS paga nesse período'}
                </td>
              </tr>
            )}
            {ordensFiltradas.map((ordem) => (
              <tr key={ordem.ordemServicoId} className="border-t hover:bg-muted/20">
                <td className="px-3 py-2">
                  {idsSelecionaveis.has(ordem.ordemServicoId) && (
                    <input
                      type="checkbox"
                      checked={selecionadas.has(ordem.ordemServicoId)}
                      onChange={() => alternarSelecao(ordem.ordemServicoId)}
                      className="size-4"
                    />
                  )}
                </td>
                <td className="px-3 py-2 font-medium">OS {ordem.ordemNumero}</td>
                <td className="px-3 py-2">{ordem.clienteNome ?? '-'}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {ordem.dataPagamento ? new Date(ordem.dataPagamento).toLocaleDateString('pt-BR') : '-'}
                </td>
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
      </div>

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
  const [filtro, setFiltro] = useState<FiltroPeriodoState>(filtroPeriodoPadrao())

  const params = {
    status: filtroStatus || undefined,
    dataInicio: filtro.periodo === 'todas' ? undefined : filtro.dataInicio || undefined,
    dataFim: filtro.periodo === 'todas' ? undefined : filtro.dataFim || undefined,
  }
  const { data, isLoading } = useNotasFiscaisSaida({ ...params, pageSize: 50 })
  const { data: resumo } = useResumoNotasFiscais(params)
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
      <FiltroPeriodoNotas valor={filtro} onChange={setFiltro} />

      <div className="flex flex-wrap gap-2">
        {(['', 'processando', 'autorizada', 'rejeitada', 'cancelada', 'erro'] as const).map((status) => (
          <button
            key={status || 'todas'}
            type="button"
            onClick={() => setFiltroStatus(status)}
            className={`h-8 px-3 rounded-md text-sm font-medium border ${filtroStatus === status ? 'bg-primary text-primary-foreground border-primary' : 'bg-background'}`}
          >
            {status ? ROTULO_STATUS_NOTA_FISCAL[status] : 'Todos os status'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 max-w-md">
        <CardIndicador titulo="Notas no filtro" valor={String(resumo?.quantidade ?? 0)} icone={<FileCheck2 size={15} />} />
        <CardIndicador titulo="Valor total" valor={formatCurrency(resumo?.valorTotal ?? 0)} icone={<Wallet size={15} />} />
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
                <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">Nenhuma nota emitida nesse filtro</td>
              </tr>
            )}
            {(data?.data ?? []).map((nota) => (
              <tr key={nota.id} className="border-t hover:bg-muted/20">
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
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center size-9 rounded-md bg-primary/10 text-primary">
          <Receipt size={18} />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Notas Fiscais</h1>
          <p className="text-sm text-muted-foreground">
            NF-e de peças e NFS-e de serviço (mão de obra), emitidas a partir das vendas recebidas no Caixa.
          </p>
        </div>
      </div>

      <div className="flex gap-2 border-b">
        <button
          type="button"
          onClick={() => setAba('pagas')}
          className={`flex items-center gap-1.5 h-10 px-4 text-sm font-medium border-b-2 -mb-px ${
            aba === 'pagas' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
          }`}
        >
          <Hourglass size={14} />
          OS Pagas p/ Emitir {ordensPagas && ordensPagas.length > 0 ? `(${ordensPagas.length})` : ''}
        </button>
        <button
          type="button"
          onClick={() => setAba('emitidas')}
          className={`flex items-center gap-1.5 h-10 px-4 text-sm font-medium border-b-2 -mb-px ${
            aba === 'emitidas' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
          }`}
        >
          <FileCheck2 size={14} />
          Notas Emitidas
        </button>
      </div>

      {aba === 'pagas' ? <AbaOsPagas /> : <AbaEmitidas />}
    </div>
  )
}
