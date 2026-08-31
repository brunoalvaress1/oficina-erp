import { useMemo, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ExternalLink,
  FileCheck2,
  FileText,
  Hourglass,
  Package,
  QrCode,
  Receipt,
  RefreshCw,
  Search,
  Wallet,
  Wrench,
  XCircle,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatCurrency } from '@/utils/format'
import { CardIndicador } from '@/features/financeiro/components/CardIndicador'
import {
  FiltroPeriodoOpcional,
  filtroPeriodoOpcionalEsteMes,
  filtroPeriodoOpcionalPadrao,
  type FiltroPeriodoOpcionalState,
} from '@/components/ui/FiltroPeriodoOpcional'
import { PermissionGate } from '../components/PermissionGate'
import { EmitirNotaFiscalModal } from '../components/EmitirNotaFiscalModal'
import {
  useCancelarNotaFiscal,
  useConsultarStatusEmLote,
  useConsultarStatusNotaFiscal,
  useEmitirNotasEmLote,
  useNotasFiscaisSaida,
  useOrdensPagasParaEmitir,
  useResumoNotasFiscais,
  useVerificarProcessandoAutomatico,
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

// Peça (NF-e/NFC-e, ICMS estadual) e Serviço (NFS-e, ISS municipal) são
// documentos fiscais diferentes — a tela inteira separa os dois em blocos
// visuais distintos (cor + ícone próprios), nunca uma lista só misturando
// as duas coisas.
const TEMA_MODELO: Record<
  ModeloNotaFiscal,
  { rotulo: string; rotuloCurto: string; subtitulo: string; icone: ReactNode; texto: string; borda: string; bgSuave: string; bgSolido: string }
> = {
  peca: {
    rotulo: 'Peças (NF-e)',
    rotuloCurto: 'Peças',
    subtitulo: 'Nota de produto · ICMS estadual',
    icone: <Package size={18} />,
    texto: 'text-blue-700 dark:text-blue-400',
    borda: 'border-blue-300 dark:border-blue-800',
    bgSuave: 'bg-blue-50 dark:bg-blue-950/30',
    bgSolido: 'bg-blue-600',
  },
  servico: {
    rotulo: 'Serviço (NFS-e)',
    rotuloCurto: 'Serviço',
    subtitulo: 'Nota de mão de obra · ISS municipal',
    icone: <Wrench size={18} />,
    texto: 'text-amber-700 dark:text-amber-400',
    borda: 'border-amber-300 dark:border-amber-800',
    bgSuave: 'bg-amber-50 dark:bg-amber-950/30',
    bgSolido: 'bg-amber-600',
  },
}

function IconeOrdenacao({ ativo, direcao }: { ativo: boolean; direcao: 'asc' | 'desc' }) {
  if (!ativo) return <ArrowUpDown size={13} className="opacity-40" />
  return direcao === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
}

// Seletor principal da tela: dois blocos grandes e visualmente distintos
// (cor e ícone próprios) pra deixar Peças e Serviço claramente separados
// como duas áreas diferentes, não como uma opção a mais dentro de um filtro.
function SeletorModeloPrincipal({
  valor,
  onChange,
  contagemPeca,
  contagemServico,
}: {
  valor: ModeloNotaFiscal
  onChange: (modelo: ModeloNotaFiscal) => void
  contagemPeca: number
  contagemServico: number
}) {
  const contagens: Record<ModeloNotaFiscal, number> = { peca: contagemPeca, servico: contagemServico }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {(['peca', 'servico'] as const).map((modelo) => {
        const tema = TEMA_MODELO[modelo]
        const ativo = valor === modelo
        return (
          <button
            key={modelo}
            type="button"
            onClick={() => onChange(modelo)}
            className={`flex items-center justify-between gap-3 rounded-xl border-2 p-4 text-left transition-colors ${
              ativo ? `${tema.borda} ${tema.bgSuave}` : 'border-transparent bg-card hover:bg-muted/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`flex items-center justify-center size-10 rounded-lg text-white ${tema.bgSolido}`}>{tema.icone}</span>
              <div>
                <p className={`font-semibold ${ativo ? tema.texto : 'text-foreground'}`}>{tema.rotulo}</p>
                <p className="text-xs text-muted-foreground">{tema.subtitulo}</p>
              </div>
            </div>
            {contagens[modelo] > 0 && (
              <span className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-full text-white ${tema.bgSolido}`}>
                {contagens[modelo]} p/ emitir
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// Cabeçalho padrão de cada tabela de notas: título contextual à esquerda
// (o que essa lista mostra) e a ação em lote relacionada à direita — deixa
// claro que o botão age sobre a tabela logo abaixo, em vez de flutuar solto
// entre os filtros.
function CabecalhoTabela({ titulo, tema, acao }: { titulo: string; tema: (typeof TEMA_MODELO)[ModeloNotaFiscal]; acao?: ReactNode }) {
  return (
    <div className={`flex items-center justify-between gap-2 flex-wrap px-4 py-3 border-b ${tema.bgSuave}`}>
      <h3 className={`text-sm font-semibold flex items-center gap-1.5 ${tema.texto}`}>
        {tema.icone} {titulo}
      </h3>
      {acao}
    </div>
  )
}

type CampoOrdenacaoOsPaga = 'ordemNumero' | 'clienteNome' | 'valor'

// Valor começa ordenando do maior pro menor no primeiro clique (mais natural
// pra achar rápido as de maior valor) — Cliente/OS começam do menor pro
// maior (A→Z, 1→N), como qualquer ordenação alfabética/numérica comum.
const DIRECAO_INICIAL: Record<CampoOrdenacaoOsPaga, 'asc' | 'desc'> = {
  ordemNumero: 'asc',
  clienteNome: 'asc',
  valor: 'desc',
}

function AbaOsPagas({ modelo }: { modelo: ModeloNotaFiscal }) {
  const tema = TEMA_MODELO[modelo]
  const { data: ordens, isLoading } = useOrdensPagasParaEmitir()
  const [ordemParaEmitir, setOrdemParaEmitir] = useState<OrdemPagaParaEmitir | null>(null)
  // Começa filtrado no mês atual — "Todas" de cara misturava OS pagas de
  // meses antigos já resolvidas de outro jeito com as realmente urgentes.
  const [filtro, setFiltro] = useState<FiltroPeriodoOpcionalState>(filtroPeriodoOpcionalEsteMes())
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set())
  const [ordenacao, setOrdenacao] = useState<{ campo: CampoOrdenacaoOsPaga; direcao: 'asc' | 'desc' } | null>(null)
  const emitirEmLote = useEmitirNotasEmLote()

  function alternarOrdenacao(campo: CampoOrdenacaoOsPaga) {
    setOrdenacao((atual) =>
      atual?.campo === campo ? { campo, direcao: atual.direcao === 'asc' ? 'desc' : 'asc' } : { campo, direcao: DIRECAO_INICIAL[campo] },
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
      if (ordenacao.campo === 'valor') {
        const valorA = modelo === 'peca' ? a.valorPecas : a.valorServicos
        const valorB = modelo === 'peca' ? b.valorPecas : b.valorServicos
        return (valorA - valorB) * multiplicador
      }
      return (a.clienteNome ?? '').localeCompare(b.clienteNome ?? '') * multiplicador
    })
  }, [ordens, filtro, ordenacao, modelo])

  // O total mostrado acompanha o modelo selecionado (Peças/Serviço) — assim
  // bate com o que aparece na coluna Valor de cada linha, em vez de somar o
  // valor da OS inteira (peça + serviço) misturado.
  const valorTotal = ordensFiltradas.reduce((soma, ordem) => soma + (modelo === 'peca' ? ordem.valorPecas : ordem.valorServicos), 0)

  function problemasDe(ordem: OrdemPagaParaEmitir): string[] {
    return modelo === 'peca' ? ordem.problemasPeca : ordem.problemasServico
  }

  // Só entram na seleção em lote as OS que realmente têm aquele modelo
  // pendente — uma OS só de serviço não aparece com checkbox no modo "Peças".
  // OS com cadastro de cliente incompleto ficam de fora da seleção/"Emitir
  // Todas" — emitir em lote ia só gerar mais uma tentativa fadada a rejeitar
  // (ver aviso na própria linha e no modal individual).
  const ordensSelecionaveis = useMemo(
    () => ordensFiltradas.filter((ordem) => (modelo === 'peca' ? ordem.pecaPendente : ordem.servicoPendente) && problemasDe(ordem).length === 0),
    [ordensFiltradas, modelo],
  )
  const idsSelecionaveis = useMemo(() => new Set(ordensSelecionaveis.map((o) => o.ordemServicoId)), [ordensSelecionaveis])
  const ordensComProblema = useMemo(
    () => ordensFiltradas.filter((ordem) => (modelo === 'peca' ? ordem.pecaPendente : ordem.servicoPendente) && problemasDe(ordem).length > 0),
    [ordensFiltradas, modelo],
  )

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
  const valorSelecionado = ordensParaEmitirLote.reduce((soma, o) => soma + (modelo === 'peca' ? o.valorPecas : o.valorServicos), 0)

  function handleEmitirLote() {
    emitirEmLote.mutate(
      {
        itens: ordensParaEmitirLote.map((o) => ({ caixaLancamentoId: o.caixaLancamentoId, ordemNumero: o.ordemNumero })),
        modelo,
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
    if (!confirm(`Emitir nota de ${tema.rotulo} para todas as ${ordensSelecionaveis.length} OS's pendentes?`)) return
    emitirEmLote.mutate({
      itens: ordensSelecionaveis.map((o) => ({ caixaLancamentoId: o.caixaLancamentoId, ordemNumero: o.ordemNumero })),
      modelo,
    })
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-3 flex flex-wrap items-center gap-3">
        <span className="text-xs font-medium text-muted-foreground shrink-0">Período</span>
        <FiltroPeriodoOpcional valor={filtro} onChange={setFiltro} />
      </div>

      <div className={`grid grid-cols-2 ${ordensComProblema.length > 0 ? 'sm:grid-cols-3' : ''} gap-3 max-w-2xl`}>
        <CardIndicador titulo="OS aguardando emissão" valor={String(ordensFiltradas.length)} icone={<Hourglass size={15} />} />
        <CardIndicador titulo={`Valor total · ${tema.rotuloCurto}`} valor={formatCurrency(valorTotal)} icone={<Wallet size={15} />} />
        {ordensComProblema.length > 0 && (
          <CardIndicador
            titulo="Precisam de atenção"
            valor={String(ordensComProblema.length)}
            subtitulo="Cadastro incompleto ou já falhou — fora do lote"
            icone={<AlertTriangle size={15} />}
            destaque="negativo"
          />
        )}
      </div>

      {/* Barra de seleção — só some do lugar quando tem algo marcado, fica grudada no topo pra continuar visível ao rolar a lista */}
      {selecionadas.size > 0 && (
        <div className={`sticky top-0 z-10 flex items-center justify-between gap-3 rounded-lg border-2 shadow-md px-4 py-3 ${tema.borda} ${tema.bgSuave}`}>
          <div className="text-sm">
            <span className="font-semibold">{selecionadas.size}</span> nota{selecionadas.size === 1 ? '' : 's'} de{' '}
            <strong>{tema.rotulo}</strong> selecionada{selecionadas.size === 1 ? '' : 's'} · Valor total:{' '}
            <span className="font-semibold">{formatCurrency(valorSelecionado)}</span>
          </div>
          <PermissionGate codigo="notas_fiscais.emitir">
            <button
              type="button"
              onClick={handleEmitirLote}
              disabled={emitirEmLote.isPending}
              className={`flex items-center gap-1.5 h-9 px-4 rounded-md text-white text-sm font-medium disabled:opacity-50 shrink-0 ${tema.bgSolido}`}
            >
              <Receipt size={14} />
              {emitirEmLote.isPending ? 'Emitindo...' : `Emitir ${selecionadas.size} selecionada${selecionadas.size === 1 ? '' : 's'}`}
            </button>
          </PermissionGate>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <CabecalhoTabela
          titulo={`OS pagas · ${tema.rotulo}`}
          tema={tema}
          acao={
            <PermissionGate codigo="notas_fiscais.emitir">
              <button
                type="button"
                onClick={handleEmitirTodas}
                disabled={ordensSelecionaveis.length === 0 || emitirEmLote.isPending}
                className="flex items-center gap-1.5 h-8 px-3 rounded-md border bg-background text-xs font-medium disabled:opacity-50"
              >
                <Receipt size={13} />
                {emitirEmLote.isPending ? 'Emitindo...' : `Emitir Todas (${ordensSelecionaveis.length})`}
              </button>
            </PermissionGate>
          }
        />
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
              <th className="text-left font-medium px-3 py-2">
                <button type="button" onClick={() => alternarOrdenacao('valor')} className="inline-flex items-center gap-1 hover:text-foreground">
                  Valor ({tema.rotuloCurto}) <IconeOrdenacao ativo={ordenacao?.campo === 'valor'} direcao={ordenacao?.direcao ?? 'desc'} />
                </button>
              </th>
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
                <td className="px-3 py-2">
                  <span className="inline-flex items-center gap-1.5">
                    {ordem.clienteNome ?? '-'}
                    {problemasDe(ordem).length > 0 && (
                      <AlertTriangle
                        size={13}
                        className="text-amber-600 shrink-0"
                        aria-label="Não vai emitir sem resolver"
                        title={problemasDe(ordem).join(' · ')}
                      />
                    )}
                  </span>
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {ordem.dataPagamento ? new Date(ordem.dataPagamento).toLocaleDateString('pt-BR') : '-'}
                </td>
                <td className="px-3 py-2">
                  {formatCurrency(modelo === 'peca' ? ordem.valorPecas : ordem.valorServicos)}
                  <span className="text-muted-foreground"> · Total OS: {formatCurrency(ordem.valorTotal)}</span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex justify-end">
                    <PermissionGate codigo="notas_fiscais.emitir">
                      {problemasDe(ordem).length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setOrdemParaEmitir(ordem)}
                          title={problemasDe(ordem).join(' · ')}
                          className="flex items-center gap-1 h-8 px-3 rounded-md border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-xs font-medium"
                        >
                          <AlertTriangle size={13} /> Ver Pendência
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setOrdemParaEmitir(ordem)}
                          className="flex items-center gap-1 h-8 px-3 rounded-md border text-xs font-medium"
                        >
                          <Receipt size={13} /> Emitir Nota Fiscal
                        </button>
                      )}
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

const OPCOES_STATUS = ['', 'processando', 'autorizada', 'rejeitada', 'cancelada', 'erro'] as const

function AbaEmitidas({ modelo }: { modelo: ModeloNotaFiscal }) {
  const tema = TEMA_MODELO[modelo]
  // Abre já filtrado em "Autorizada" — é o que interessa olhar de cara (nota
  // válida, já saiu); pra ver rejeitadas/erros/processando é só trocar o chip.
  const [filtroStatus, setFiltroStatus] = useState<StatusNotaFiscal | ''>('autorizada')
  const [filtro, setFiltro] = useState<FiltroPeriodoOpcionalState>(filtroPeriodoOpcionalPadrao())
  const [busca, setBusca] = useState('')
  const [ordenacao, setOrdenacao] = useState<{ campo: CampoOrdenacaoNotaFiscal; direcao: 'asc' | 'desc' }>({
    campo: 'createdAt',
    direcao: 'desc',
  })

  // Reconsulta sozinho, em segundo plano, as notas ainda "processando" desse
  // modelo — independe do filtro de status escolhido acima, então continua
  // funcionando mesmo com a tela aberta em "Autorizada".
  useVerificarProcessandoAutomatico(modelo)

  function alternarOrdenacao(campo: CampoOrdenacaoNotaFiscal) {
    setOrdenacao((atual) => (atual.campo === campo ? { campo, direcao: atual.direcao === 'asc' ? 'desc' : 'asc' } : { campo, direcao: 'asc' }))
  }

  const periodoParams = {
    dataInicio: filtro.periodo === 'todas' ? undefined : filtro.dataInicio || undefined,
    dataFim: filtro.periodo === 'todas' ? undefined : filtro.dataFim || undefined,
  }
  const params = { modelo, status: filtroStatus || undefined, ...periodoParams }
  const { data, isLoading } = useNotasFiscaisSaida({
    ...params,
    pageSize: 50,
    search: busca || undefined,
    sortBy: ordenacao.campo,
    sortDirection: ordenacao.direcao,
  })
  const { data: resumo } = useResumoNotasFiscais(params)
  // Sempre "autorizada", independente do chip de status selecionado — é o
  // card fixo de "quanto já autorizei de verdade nesse período".
  const { data: resumoAutorizadas } = useResumoNotasFiscais({ modelo, status: 'autorizada', ...periodoParams })
  const consultarStatus = useConsultarStatusNotaFiscal()
  const consultarStatusEmLote = useConsultarStatusEmLote()
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

  // Só as que estão nessa página (a lista é paginada, 50 por vez) — se tiver
  // mais que isso "processando", precisa passar de página ou filtrar mais.
  const notasProcessando = (data?.data ?? []).filter((n) => n.status === 'processando' || n.status === 'pendente')

  function handleProcessarTodas() {
    if (notasProcessando.length === 0) return
    consultarStatusEmLote.mutate(notasProcessando.map((n) => n.id))
  }

  return (
    <div className="space-y-4">
      {/* Barra de filtros — período, busca e status sempre na mesma ordem, cada linha com seu rótulo */}
      <div className="rounded-lg border bg-card p-3 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground shrink-0">Período</span>
          <FiltroPeriodoOpcional valor={filtro} onChange={setFiltro} />
        </div>

        <div className="h-px bg-border" />

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground shrink-0">Buscar</span>
          <div className="relative w-full sm:w-72 shrink-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Cliente, nº da OS, chave de acesso..."
              className="w-full h-8 pl-8 pr-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <span className="text-xs font-medium text-muted-foreground shrink-0 sm:ml-2">Status</span>
          <div className="flex flex-wrap gap-1.5">
            {OPCOES_STATUS.map((status) => (
              <button
                key={status || 'todas'}
                type="button"
                onClick={() => setFiltroStatus(status)}
                className={`h-8 px-3 rounded-full text-xs font-medium border transition-colors ${
                  filtroStatus === status ? `text-white border-transparent ${tema.bgSolido}` : 'bg-background hover:bg-muted'
                }`}
              >
                {status ? ROTULO_STATUS_NOTA_FISCAL[status] : 'Todos os status'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl">
        <CardIndicador titulo="Notas no filtro" valor={String(resumo?.quantidade ?? 0)} icone={<FileCheck2 size={15} />} />
        <CardIndicador titulo="Valor total no filtro" valor={formatCurrency(resumo?.valorTotal ?? 0)} icone={<Wallet size={15} />} />
        <CardIndicador
          titulo="Notas autorizadas"
          valor={String(resumoAutorizadas?.quantidade ?? 0)}
          subtitulo={formatCurrency(resumoAutorizadas?.valorTotal ?? 0)}
          icone={<FileCheck2 size={15} />}
          destaque="positivo"
        />
      </div>

      <div className="border rounded-lg overflow-hidden">
        <CabecalhoTabela
          titulo={`Notas emitidas · ${tema.rotulo}`}
          tema={tema}
          acao={
            notasProcessando.length > 0 && (
              <button
                type="button"
                onClick={handleProcessarTodas}
                disabled={consultarStatusEmLote.isPending}
                className="flex items-center gap-1.5 h-8 px-3 rounded-md border bg-background text-xs font-medium disabled:opacity-50"
              >
                <RefreshCw size={13} />
                {consultarStatusEmLote.isPending ? 'Processando...' : `Processar Todas (${notasProcessando.length})`}
              </button>
            )
          }
        />
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
  const [modelo, setModelo] = useState<ModeloNotaFiscal>('peca')
  const [aba, setAba] = useState<'pagas' | 'emitidas'>('pagas')
  const { data: ordensPagas } = useOrdensPagasParaEmitir()
  const tema = TEMA_MODELO[modelo]

  const contagemPeca = ordensPagas?.filter((o) => o.pecaPendente).length ?? 0
  const contagemServico = ordensPagas?.filter((o) => o.servicoPendente).length ?? 0

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

      {/* Separação principal: Peças e Serviço são áreas completamente
          diferentes da tela, cada uma com sua cor/ícone — tudo abaixo
          (abas, filtros, tabelas) pertence só ao modelo escolhido aqui. */}
      <SeletorModeloPrincipal valor={modelo} onChange={setModelo} contagemPeca={contagemPeca} contagemServico={contagemServico} />

      <div className="flex gap-2 border-b">
        <button
          type="button"
          onClick={() => setAba('pagas')}
          className={`flex items-center gap-1.5 h-10 px-4 text-sm font-medium border-b-2 -mb-px transition-colors ${
            aba === 'pagas' ? `${tema.borda} ${tema.texto}` : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Hourglass size={14} />
          OS Pagas p/ Emitir {ordensPagas && ordensPagas.length > 0 ? `(${modelo === 'peca' ? contagemPeca : contagemServico})` : ''}
        </button>
        <button
          type="button"
          onClick={() => setAba('emitidas')}
          className={`flex items-center gap-1.5 h-10 px-4 text-sm font-medium border-b-2 -mb-px transition-colors ${
            aba === 'emitidas' ? `${tema.borda} ${tema.texto}` : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileCheck2 size={14} />
          Notas Emitidas
        </button>
      </div>

      {aba === 'pagas' ? <AbaOsPagas key={modelo} modelo={modelo} /> : <AbaEmitidas key={modelo} modelo={modelo} />}
    </div>
  )
}
