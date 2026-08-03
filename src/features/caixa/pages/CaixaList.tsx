import { useState } from 'react'
import { Lock, Unlock } from 'lucide-react'
import { useDebouncedCallback } from 'use-debounce'
import { useCaixaLancamentos } from '../hooks/useCaixaLancamentos'
import { CaixaCard } from '../components/CaixaCard'
import { DashboardCaixa } from '../components/DashboardCaixa'
import { AbrirCaixaModal } from '../components/AbrirCaixaModal'
import { FecharCaixaModal } from '../components/FecharCaixaModal'
import { PermissionGate } from '../components/PermissionGate'
import { useSessaoCaixaAberta } from '../hooks/useCaixaSessao'
import { Pagination } from '@/components/ui/Pagination'
import { formatDate } from '@/utils/format'
import type { FiltroCaixa } from '../types/caixa'

const FILTROS: Array<{ valor: FiltroCaixa; rotulo: string }> = [
  { valor: 'todas', rotulo: 'Todas' },
  { valor: 'aguardando', rotulo: 'Ordens de Serviço' },
  { valor: 'pendente', rotulo: 'Pendentes' },
  { valor: 'recebidas_hoje', rotulo: 'Recebidas Hoje' },
]

export function CaixaList() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [busca, setBusca] = useState('')
  const [buscaDebounced, setBuscaDebounced] = useState('')
  const [filtro, setFiltro] = useState<FiltroCaixa>('aguardando')
  const [modalAbrirAberto, setModalAbrirAberto] = useState(false)
  const [modalFecharAberto, setModalFecharAberto] = useState(false)

  const { data: sessaoAberta, isLoading: carregandoSessao } = useSessaoCaixaAberta()

  const aplicarBuscaComDebounce = useDebouncedCallback((valor: string) => {
    setBuscaDebounced(valor)
    setPage(1)
  }, 300)

  function handleBuscaChange(valor: string) {
    setBusca(valor)
    aplicarBuscaComDebounce(valor)
  }

  const { data, isLoading } = useCaixaLancamentos({ page, pageSize, search: buscaDebounced, filtro })
  const lancamentos = data?.data ?? []
  const total = data?.total ?? 0

  if (carregandoSessao) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }

  if (!sessaoAberta) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Caixa</h1>
        <div className="rounded-lg border p-10 flex flex-col items-center justify-center gap-4 text-center">
          <Lock size={32} className="text-muted-foreground" />
          <div>
            <p className="font-medium">O caixa está fechado</p>
            <p className="text-sm text-muted-foreground">Abra o caixa para ver os lançamentos e receber pagamentos.</p>
          </div>
          <PermissionGate
            codigo="caixa.abrir"
            fallback={<p className="text-xs text-muted-foreground">Você não tem permissão para abrir o caixa.</p>}
          >
            <button
              type="button"
              onClick={() => setModalAbrirAberto(true)}
              className="flex items-center gap-2 h-10 px-5 rounded-md bg-primary text-primary-foreground text-sm font-medium"
            >
              <Unlock size={16} /> Abrir Caixa
            </button>
          </PermissionGate>
        </div>

        <AbrirCaixaModal open={modalAbrirAberto} onOpenChange={setModalAbrirAberto} />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <div className="lg:col-span-3 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Caixa</h1>
            <p className="text-xs text-muted-foreground">
              Aberto por {sessaoAberta.funcionarioAberturaNome ?? '-'} desde {formatDate(sessaoAberta.dataAbertura)}
            </p>
          </div>
          <PermissionGate codigo="caixa.fechar">
            <button
              type="button"
              onClick={() => setModalFecharAberto(true)}
              className="flex items-center gap-2 h-9 px-4 rounded-md border text-sm font-medium"
            >
              <Lock size={15} /> Fechar Caixa
            </button>
          </PermissionGate>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="p-3 border-b bg-muted/20 space-y-2">
            <input
              type="text"
              value={busca}
              onChange={(e) => handleBuscaChange(e.target.value)}
              placeholder="Buscar por cliente, CPF, telefone, número da OS, placa, modelo ou Prisma..."
              className="w-full h-9 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
            <div className="flex flex-wrap gap-2">
              {FILTROS.map((f) => (
                <button
                  key={f.valor}
                  type="button"
                  onClick={() => {
                    setFiltro(f.valor)
                    setPage(1)
                  }}
                  className={`h-7 px-3 rounded-full text-xs font-medium border ${
                    filtro === f.valor ? 'bg-primary text-primary-foreground border-primary' : 'bg-background'
                  }`}
                >
                  {f.rotulo}
                </button>
              ))}
            </div>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="w-10 px-3 py-2"></th>
                <th className="text-left font-medium px-3 py-2">OS</th>
                <th className="text-left font-medium px-3 py-2">Cliente</th>
                <th className="text-left font-medium px-3 py-2">Veículo</th>
                <th className="text-left font-medium px-3 py-2">Placa</th>
                <th className="text-left font-medium px-3 py-2">Status</th>
                <th className="text-right font-medium px-3 py-2">Valor</th>
                <th className="text-left font-medium px-3 py-2">Data</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">
                    Carregando...
                  </td>
                </tr>
              )}
              {!isLoading && total === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">
                    Nenhum lançamento encontrado
                  </td>
                </tr>
              )}
              {lancamentos.map((lancamento) => (
                <CaixaCard key={lancamento.id} lancamento={lancamento} />
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          pageSize={pageSize}
          totalItems={total}
          itemsMostrados={lancamentos.length}
          itemLabel="lançamentos"
          onPageChange={setPage}
          onPageSizeChange={(novoTamanho) => {
            setPageSize(novoTamanho)
            setPage(1)
          }}
        />
      </div>

      <div>
        <DashboardCaixa />
      </div>

      <FecharCaixaModal caixaSessaoId={sessaoAberta.id} open={modalFecharAberto} onOpenChange={setModalFecharAberto} />
    </div>
  )
}
