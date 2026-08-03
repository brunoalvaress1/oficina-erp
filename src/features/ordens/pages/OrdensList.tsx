import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDebouncedCallback } from 'use-debounce'
import { Plus } from 'lucide-react'
import { useOrdens } from '../hooks/useOrdens'
import { useSemaforoItens } from '../hooks/useSemaforoItens'
import { OrdemCard } from '../components/OrdemCard'
import { PermissionGate } from '../components/PermissionGate'
import { Pagination } from '@/components/ui/Pagination'
import { ROTULO_STATUS_ORDEM, type StatusOrdemServico } from '../types/ordemServico'

const FILTROS_STATUS: Array<{ valor: StatusOrdemServico | 'todas'; rotulo: string }> = [
  { valor: 'todas', rotulo: 'Todas' },
  { valor: 'em_aberto', rotulo: ROTULO_STATUS_ORDEM.em_aberto },
  { valor: 'em_execucao', rotulo: ROTULO_STATUS_ORDEM.em_execucao },
  { valor: 'aguardando_aprovacao', rotulo: ROTULO_STATUS_ORDEM.aguardando_aprovacao },
  { valor: 'aguardando_pecas', rotulo: ROTULO_STATUS_ORDEM.aguardando_pecas },
  { valor: 'finalizada', rotulo: ROTULO_STATUS_ORDEM.finalizada },
  { valor: 'enviada_caixa', rotulo: ROTULO_STATUS_ORDEM.enviada_caixa },
  { valor: 'paga', rotulo: ROTULO_STATUS_ORDEM.paga },
  { valor: 'cancelada', rotulo: ROTULO_STATUS_ORDEM.cancelada },
]

export function OrdensList() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [busca, setBusca] = useState('')
  const [buscaDebounced, setBuscaDebounced] = useState('')
  const [status, setStatus] = useState<StatusOrdemServico | 'todas'>('todas')
  const [numeroNota, setNumeroNota] = useState('')
  const [numeroNotaDebounced, setNumeroNotaDebounced] = useState('')

  const aplicarBuscaComDebounce = useDebouncedCallback((valor: string) => {
    setBuscaDebounced(valor)
    setPage(1)
  }, 300)

  const aplicarNumeroNotaComDebounce = useDebouncedCallback((valor: string) => {
    setNumeroNotaDebounced(valor)
    setPage(1)
  }, 300)

  function handleBuscaChange(valor: string) {
    setBusca(valor)
    aplicarBuscaComDebounce(valor)
  }

  function handleNumeroNotaChange(valor: string) {
    setNumeroNota(valor)
    aplicarNumeroNotaComDebounce(valor)
  }

  const { data, isLoading } = useOrdens({
    page,
    pageSize,
    search: buscaDebounced,
    status,
    numeroNota: numeroNotaDebounced,
    sortBy: 'numero',
    sortDirection: 'desc',
  })

  const ordens = data?.data ?? []
  const totalOrdens = data?.total ?? 0

  const { data: semaforos = {} } = useSemaforoItens(ordens.map((o) => o.id))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Ordens de Serviço</h1>
        <PermissionGate codigo="ordens.criar">
          <button
            onClick={() => navigate('/ordens/nova')}
            className="flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium"
          >
            <Plus size={16} /> Criar Ordem de Serviço
          </button>
        </PermissionGate>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="p-3 border-b bg-muted/20 space-y-2">
          <div className="flex flex-col md:flex-row gap-2">
            <input
              type="text"
              value={busca}
              onChange={(e) => handleBuscaChange(e.target.value)}
              placeholder="Buscar por número da OS, Prisma, placa, modelo, cliente, CPF/CNPJ ou telefone..."
              className="flex-1 h-9 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
            <input
              type="text"
              value={numeroNota}
              onChange={(e) => handleNumeroNotaChange(e.target.value)}
              placeholder="Filtrar por nº da Nota Fiscal do fornecedor..."
              className="md:w-72 h-9 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTROS_STATUS.map((filtro) => (
              <button
                key={filtro.valor}
                type="button"
                onClick={() => {
                  setStatus(filtro.valor)
                  setPage(1)
                }}
                className={`h-7 px-3 rounded-full text-xs font-medium border ${
                  status === filtro.valor ? 'bg-primary text-primary-foreground border-primary' : 'bg-background'
                }`}
              >
                {filtro.rotulo}
              </button>
            ))}
          </div>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="w-10 px-3 py-2"></th>
              <th className="text-left font-medium px-3 py-2">Nº OS</th>
              <th className="text-left font-medium px-3 py-2">Cliente</th>
              <th className="text-left font-medium px-3 py-2">Veículo</th>
              <th className="text-left font-medium px-3 py-2">Placa</th>
              <th className="text-left font-medium px-3 py-2">KM</th>
              <th className="text-left font-medium px-3 py-2">Status</th>
              <th className="text-left font-medium px-3 py-2">Mecânico</th>
              <th className="text-right font-medium px-3 py-2">Valor Total</th>
              <th className="text-left font-medium px-3 py-2">Abertura</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={10} className="px-3 py-6 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            )}
            {!isLoading && totalOrdens === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-6 text-center text-muted-foreground">
                  Nenhuma ordem de serviço encontrada
                </td>
              </tr>
            )}
            {ordens.map((ordem) => (
              <OrdemCard key={ordem.id} ordem={ordem} semaforo={semaforos[ordem.id] ?? 'verde'} />
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        totalItems={totalOrdens}
        itemsMostrados={ordens.length}
        itemLabel="ordens"
        onPageChange={setPage}
        onPageSizeChange={(novoTamanho) => {
          setPageSize(novoTamanho)
          setPage(1)
        }}
      />
    </div>
  )
}
