import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDebouncedCallback } from 'use-debounce'
import { ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { useOrdens } from '../hooks/useOrdens'
import { useSemaforoItens } from '../hooks/useSemaforoItens'
import { OrdemCard } from '../components/OrdemCard'
import { PermissionGate } from '../components/PermissionGate'
import { Pagination } from '@/components/ui/Pagination'
import { ROTULO_STATUS_ORDEM, type CampoOrdenacaoOrdem, type StatusOrdemServico } from '../types/ordemServico'

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

const CLASSE_INPUT_FILTRO_COLUNA = 'w-full h-7 px-1.5 rounded border bg-background text-xs outline-none focus:ring-1 focus:ring-primary/30'

export function OrdensList() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [busca, setBusca] = useState('')
  const [buscaDebounced, setBuscaDebounced] = useState('')
  const [status, setStatus] = useState<StatusOrdemServico | 'todas'>('todas')
  const [numeroNota, setNumeroNota] = useState('')
  const [numeroNotaDebounced, setNumeroNotaDebounced] = useState('')
  const [numero, setNumero] = useState('')
  const [numeroDebounced, setNumeroDebounced] = useState('')
  const [clienteNome, setClienteNome] = useState('')
  const [clienteNomeDebounced, setClienteNomeDebounced] = useState('')
  const [veiculoModelo, setVeiculoModelo] = useState('')
  const [veiculoModeloDebounced, setVeiculoModeloDebounced] = useState('')
  const [placa, setPlaca] = useState('')
  const [placaDebounced, setPlacaDebounced] = useState('')
  const [kmAtual, setKmAtual] = useState('')
  const [kmAtualDebounced, setKmAtualDebounced] = useState('')
  const [sortBy, setSortBy] = useState<CampoOrdenacaoOrdem>('numero')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  function handleOrdenarPor(campo: CampoOrdenacaoOrdem) {
    if (sortBy === campo) {
      setSortDirection((atual) => (atual === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(campo)
      setSortDirection('asc')
    }
  }

  const aplicarBuscaComDebounce = useDebouncedCallback((valor: string) => {
    setBuscaDebounced(valor)
    setPage(1)
  }, 300)

  const aplicarNumeroNotaComDebounce = useDebouncedCallback((valor: string) => {
    setNumeroNotaDebounced(valor)
    setPage(1)
  }, 300)

  const aplicarNumeroComDebounce = useDebouncedCallback((valor: string) => {
    setNumeroDebounced(valor)
    setPage(1)
  }, 300)

  const aplicarClienteNomeComDebounce = useDebouncedCallback((valor: string) => {
    setClienteNomeDebounced(valor)
    setPage(1)
  }, 300)

  const aplicarVeiculoModeloComDebounce = useDebouncedCallback((valor: string) => {
    setVeiculoModeloDebounced(valor)
    setPage(1)
  }, 300)

  const aplicarPlacaComDebounce = useDebouncedCallback((valor: string) => {
    setPlacaDebounced(valor)
    setPage(1)
  }, 300)

  const aplicarKmAtualComDebounce = useDebouncedCallback((valor: string) => {
    setKmAtualDebounced(valor)
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

  function handleNumeroChange(valor: string) {
    setNumero(valor)
    aplicarNumeroComDebounce(valor)
  }

  function handleClienteNomeChange(valor: string) {
    setClienteNome(valor)
    aplicarClienteNomeComDebounce(valor)
  }

  function handleVeiculoModeloChange(valor: string) {
    setVeiculoModelo(valor)
    aplicarVeiculoModeloComDebounce(valor)
  }

  function handlePlacaChange(valor: string) {
    setPlaca(valor)
    aplicarPlacaComDebounce(valor)
  }

  function handleKmAtualChange(valor: string) {
    setKmAtual(valor)
    aplicarKmAtualComDebounce(valor)
  }

  const { data, isLoading } = useOrdens({
    page,
    pageSize,
    search: buscaDebounced,
    status,
    numeroNota: numeroNotaDebounced,
    numero: numeroDebounced,
    clienteNome: clienteNomeDebounced,
    veiculoModelo: veiculoModeloDebounced,
    placa: placaDebounced,
    kmAtual: kmAtualDebounced,
    sortBy,
    sortDirection,
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
          <p className="text-xs text-muted-foreground">Use os campos abaixo do cabeçalho da tabela pra filtrar por coluna (Nº OS, cliente, veículo, placa, KM, status).</p>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="w-10 px-3 py-2"></th>
              <ThOrdenavel campo="numero" rotulo="Nº OS" sortBy={sortBy} sortDirection={sortDirection} onOrdenar={handleOrdenarPor} />
              <th className="text-left font-medium px-3 py-2">Cliente</th>
              <th className="text-left font-medium px-3 py-2">Veículo</th>
              <th className="text-left font-medium px-3 py-2">Placa</th>
              <th className="text-left font-medium px-3 py-2">KM</th>
              <ThOrdenavel campo="status" rotulo="Status" sortBy={sortBy} sortDirection={sortDirection} onOrdenar={handleOrdenarPor} />
              <th className="text-left font-medium px-3 py-2">Mecânico</th>
              <ThOrdenavel
                campo="valorTotal"
                rotulo="Valor Total"
                alinhamento="right"
                sortBy={sortBy}
                sortDirection={sortDirection}
                onOrdenar={handleOrdenarPor}
              />
              <ThOrdenavel campo="dataAbertura" rotulo="Abertura" sortBy={sortBy} sortDirection={sortDirection} onOrdenar={handleOrdenarPor} />
            </tr>
            <tr className="bg-muted/20">
              <th className="px-3 py-1.5"></th>
              <th className="px-2 py-1.5">
                <input
                  type="text"
                  inputMode="numeric"
                  value={numero}
                  onChange={(e) => handleNumeroChange(e.target.value)}
                  placeholder="Filtrar..."
                  className={CLASSE_INPUT_FILTRO_COLUNA}
                />
              </th>
              <th className="px-2 py-1.5">
                <input
                  type="text"
                  value={clienteNome}
                  onChange={(e) => handleClienteNomeChange(e.target.value)}
                  placeholder="Filtrar..."
                  className={CLASSE_INPUT_FILTRO_COLUNA}
                />
              </th>
              <th className="px-2 py-1.5">
                <input
                  type="text"
                  value={veiculoModelo}
                  onChange={(e) => handleVeiculoModeloChange(e.target.value)}
                  placeholder="Filtrar..."
                  className={CLASSE_INPUT_FILTRO_COLUNA}
                />
              </th>
              <th className="px-2 py-1.5">
                <input
                  type="text"
                  value={placa}
                  onChange={(e) => handlePlacaChange(e.target.value)}
                  placeholder="Filtrar..."
                  className={CLASSE_INPUT_FILTRO_COLUNA}
                />
              </th>
              <th className="px-2 py-1.5">
                <input
                  type="text"
                  inputMode="numeric"
                  value={kmAtual}
                  onChange={(e) => handleKmAtualChange(e.target.value)}
                  placeholder="Filtrar..."
                  className={CLASSE_INPUT_FILTRO_COLUNA}
                />
              </th>
              <th className="px-2 py-1.5">
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value as StatusOrdemServico | 'todas')
                    setPage(1)
                  }}
                  className={CLASSE_INPUT_FILTRO_COLUNA}
                >
                  {FILTROS_STATUS.map((filtro) => (
                    <option key={filtro.valor} value={filtro.valor}>
                      {filtro.rotulo}
                    </option>
                  ))}
                </select>
              </th>
              <th className="px-2 py-1.5"></th>
              <th className="px-2 py-1.5"></th>
              <th className="px-2 py-1.5"></th>
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

interface ThOrdenavelProps {
  campo: CampoOrdenacaoOrdem
  rotulo: string
  alinhamento?: 'left' | 'right'
  sortBy: CampoOrdenacaoOrdem
  sortDirection: 'asc' | 'desc'
  onOrdenar: (campo: CampoOrdenacaoOrdem) => void
}

function ThOrdenavel({ campo, rotulo, alinhamento = 'left', sortBy, sortDirection, onOrdenar }: ThOrdenavelProps) {
  const ativo = sortBy === campo
  return (
    <th className={`font-medium px-3 py-2 ${alinhamento === 'right' ? 'text-right' : 'text-left'}`}>
      <button
        type="button"
        onClick={() => onOrdenar(campo)}
        className={`flex items-center gap-0.5 hover:text-foreground transition-colors ${alinhamento === 'right' ? 'ml-auto' : ''} ${ativo ? 'text-foreground' : ''}`}
      >
        {rotulo}
        {ativo && (sortDirection === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
      </button>
    </th>
  )
}
