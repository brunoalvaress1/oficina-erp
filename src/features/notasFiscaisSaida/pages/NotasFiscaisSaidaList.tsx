import { useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ExternalLink,
  FileCheck2,
  FileText,
  Hourglass,
  QrCode,
  Receipt,
  RefreshCw,
  Search,
  Wallet,
  XCircle,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatCurrency } from '@/utils/format'
import { CardIndicador } from '@/features/financeiro/components/CardIndicador'
import {
  FiltroPeriodoOpcional,
  filtroPeriodoOpcionalPadrao,
  type FiltroPeriodoOpcionalState,
} from '@/components/ui/FiltroPeriodoOpcional'
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
  type CampoOrdenacaoNotaFiscal,
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

function IconeOrdenacao({ ativo, direcao }: { ativo: boolean; direcao: 'asc' | 'desc' }) {
  if (!ativo) return <ArrowUpDown size={13} className="opacity-40" />
  return direcao === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
}

type CampoOrdenacaoOsPaga = 'ordemNumero' | 'clienteNome'

function AbaOsPagas() {
  const { data: ordens, isLoading } = useOrdensPagasParaEmitir()
  const [ordemParaEmitir, setOrdemParaEmitir] = useState<OrdemPagaParaEmitir | null>(null)
  const [filtro, setFiltro] = useState<FiltroPeriodoOpcionalState>(filtroPeriodoOpcionalPadrao())
  const [modeloSelecao, setModeloSelecao] = useState<ModeloNotaFiscal>('peca')
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set())
  const [ordenacao, setOrdenacao] = useState<{ campo: CampoOrdenacaoOsPaga; direcao: 'asc' | 'desc' } | null>(null)
  const emitirEmLote = useEmitirNotasEmLote()

  function alternarOrdenacao(campo: CampoOrdenacaoOsPaga) {
    setOrdenacao((atual) =>
      atual?.campo === campo ? { campo, direcao: atual.direcao === 'asc' ? 'desc' : 'asc' } : { campo, direcao: 'asc' },
    )
  }

  const ordensFiltradas = useMemo(() => {
    const lista = ordens ?? []
    const filtradas =
      filtro.periodo === 'todas' ? lista : lista.filter((ordem) => dataDentroDoIntervalo(ordem.dataPagamento, filtro.dataInicio, filtro.dataFim))
    if (!ordenacao) return filtradas

    // Lista inteira já vem pro front (sem paginação servidor) — ordenar aqui
    // mesmo, sem precisar ir de novo no banco.
    const multiplicador = ordenacao.direcao === 'asc' ? 1 : -1
    return [...filtradas].sort((a, b) => {
      if (ordenacao.campo === 'ordemNumero') return (a.ordemNumero - b.ordemNumero) * multiplicador
      return (a.clienteNome ?? '').localeCompare(b.clienteNome ?? '') * multiplicador
    })
  }, [ordens, filtro, ordenacao])

  // O total mostrado acompanha o modelo selecionado (Peças/Serviço) — assim
  // bate com o que aparece na coluna Valor de cada linha, em vez de somar o
  // valor da OS inteira (peça + serviço) misturado.
  const valorTotal = ordensFiltradas.reduce(
    (soma, ordem) => soma + (modeloSelecao === 'peca' ? ordem.valorPecas : ordem.valorServicos),
    0,
  )

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

  // Emite todas as pendentes do modelo selecionado de uma vez, sem precisar
  // marcar cada checkbox — mesma emissão em lote de sempre (uma por vez,
  // sequencial, pra não estourar limite de taxa da Focus), só que já parte
  // com a lista inteira pré-selecionada.
  function handleEmitirTodas() {
    if (ordensSelecionaveis.length === 0) return
    if (!confirm(`Emitir nota de ${ROTULO_MODELO[modeloSelecao]} para todas as ${ordensSelecionaveis.length} OS's pendentes?`)) return
    emitirEmLote.mutate({
      itens: ordensSelecionaveis.map((o) => ({ caixaLancamentoId: o.caixaLancamentoId, ordemNumero: o.ordemNumero })),
      modelo: modeloSelecao,
    })
  }

  return (
    <div className="space-y-3">
      <FiltroPeriodoOpcional valor={filtro} onChange={setFiltro} />

      <div className="grid grid-cols-2 gap-3 max-w-md">
        <CardIndicador titulo="OS aguardando emissão" valor={String(ordensFiltradas.length)} icone={<Hourglass size={15} />} />
        <CardIndicador titulo="Valor total" valor={formatCurrency(valorTotal)} icone={<Wallet size={15} />} />
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
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
        <PermissionGate codigo="notas_fiscais.emitir">
          <button
            type="button"
            onClick={handleEmitirTodas}
            disabled={ordensSelecionaveis.length === 0 || emitirEmLote.isPending}
            className="flex items-center gap-1.5 h-8 px-3 rounded-md border text-xs font-medium disabled:opacity-50"
          >
            <Receipt size={13} />
            {emitirEmLote.isPending ? 'Emitindo...' : `Emitir Todas (${ordensSelecionaveis.length})`}
          </button>
        </PermissionGate>
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
              <th className="text-left font-medium px-3 py-2">
                <button type="button" onClick={() => alternarOrdenacao('ordemNumero')} className="inline-flex items-center gap-1 hover:text-foreground">
                  OS <IconeOrdenacao ativo={ordenacao?.campo === 'ordemNumero'} direcao={ordenacao?.direcao ?? 'asc'} />
                </button>
              </th>
              <th className="text-left font-medium px-3 py-2">
                <button type="button" onClick={() => alternarOrdenacao('clienteNome')} className="inline-flex items-center gap-1 hover:text-foreground">
                  Cliente <IconeOrdenacao ativo={ordenacao?.campo === 'clienteNome'} direcao={ordenacao?.direcao ?? 'asc'} />
                </button>
              </th>
              <th className="text-left font-medium px-3 py-2">Pago em</th>
              <th className="text-left font-medium px-3 py-2">Valor ({modeloSelecao === 'peca' ? 'Peças' : 'Serviço'})</th>
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
                <td className="px-3 py-2">
                  {formatCurrency(modeloSelecao === 'peca' ? ordem.valorPecas : ordem.valorServicos)}
                  <span className="text-muted-foreground"> · Total OS: {formatCurrency(ordem.valorTotal)}</span>
                </td>
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
  const [filtro, setFiltro] = useState<FiltroPeriodoOpcionalState>(filtroPeriodoOpcionalPadrao())
  const [busca, setBusca] = useState('')
  const [ordenacao, setOrdenacao] = useState<{ campo: CampoOrdenacaoNotaFiscal; direcao: 'asc' | 'desc' }>({
    campo: 'createdAt',
    direcao: 'desc',
  })

  function alternarOrdenacao(campo: CampoOrdenacaoNotaFiscal) {
    setOrdenacao((atual) => (atual.campo === campo ? { campo, direcao: atual.direcao === 'asc' ? 'desc' : 'asc' } : { campo, direcao: 'asc' }))
  }

  const params = {
    status: filtroStatus || undefined,
    dataInicio: filtro.periodo === 'todas' ? undefined : filtro.dataInicio || undefined,
    dataFim: filtro.periodo === 'todas' ? undefined : filtro.dataFim || undefined,
  }
  const { data, isLoading } = useNotasFiscaisSaida({
    ...params,
    pageSize: 50,
    search: busca || undefined,
    sortBy: ordenacao.campo,
    sortDirection: ordenacao.direcao,
  })
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
      <FiltroPeriodoOpcional valor={filtro} onChange={setFiltro} />

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por cliente, nº da OS, chave de acesso..."
          className="w-full h-9 pl-8 pr-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

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
              <th className="text-left font-medium px-3 py-2">
                <button type="button" onClick={() => alternarOrdenacao('createdAt')} className="inline-flex items-center gap-1 hover:text-foreground">
                  Data <IconeOrdenacao ativo={ordenacao.campo === 'createdAt'} direcao={ordenacao.direcao} />
                </button>
              </th>
              <th className="text-left font-medium px-3 py-2">
                <button type="button" onClick={() => alternarOrdenacao('ordemNumero')} className="inline-flex items-center gap-1 hover:text-foreground">
                  OS <IconeOrdenacao ativo={ordenacao.campo === 'ordemNumero'} direcao={ordenacao.direcao} />
                </button>
              </th>
              <th className="text-left font-medium px-3 py-2">Tipo</th>
              <th className="text-left font-medium px-3 py-2">
                <button type="button" onClick={() => alternarOrdenacao('clienteNome')} className="inline-flex items-center gap-1 hover:text-foreground">
                  Cliente <IconeOrdenacao ativo={ordenacao.campo === 'clienteNome'} direcao={ordenacao.direcao} />
                </button>
              </th>
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
