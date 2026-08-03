import { useState } from 'react'
import { Plus, Pencil, Trash2, Upload, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { useVeiculos } from '../hooks/useVeiculos'
import { useDeleteVeiculo } from '../hooks/useVeiculoMutations'
import { VeiculoModal } from '../components/VeiculoModal'
import { ImportarVeiculosModal } from '../components/ImportarVeiculosModal'
import { PermissionGate } from '../components/PermissionGate'
import { Pagination } from '@/components/ui/Pagination'
import type { CampoOrdenacaoVeiculo, ListarVeiculosResult, Veiculo } from '../types/veiculo'

export function VeiculosList() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [busca, setBusca] = useState('')
  const [ordenacao, setOrdenacao] = useState<{ campo: CampoOrdenacaoVeiculo; direcao: 'asc' | 'desc' }>({
    campo: 'placa',
    direcao: 'asc',
  })

  const { data, isLoading } = useVeiculos({
    page,
    pageSize,
    search: busca,
    sortBy: ordenacao.campo,
    sortDirection: ordenacao.direcao,
  })
  const veiculos: Veiculo[] = (data as ListarVeiculosResult | undefined)?.data ?? []
  const totalVeiculos = (data as ListarVeiculosResult | undefined)?.total ?? 0
  const deleteMutation = useDeleteVeiculo()

  const [modalOpen, setModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [veiculoEditando, setVeiculoEditando] = useState<Veiculo | undefined>()

  function alternarOrdenacao(campo: CampoOrdenacaoVeiculo) {
    setOrdenacao((prev) =>
      prev.campo === campo
        ? { campo, direcao: prev.direcao === 'asc' ? 'desc' : 'asc' }
        : { campo, direcao: 'asc' },
    )
    setPage(1)
  }

  function IconeOrdenacao({ campo }: { campo: CampoOrdenacaoVeiculo }) {
    if (ordenacao.campo !== campo) return <ArrowUpDown size={13} className="opacity-40" />
    return ordenacao.direcao === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
  }

  function handleNovo() {
    setVeiculoEditando(undefined)
    setModalOpen(true)
  }

  function handleEditar(veiculo: Veiculo) {
    setVeiculoEditando(veiculo)
    setModalOpen(true)
  }

  function handleExcluir(veiculo: Veiculo) {
    if (confirm(`Excluir o veículo placa "${veiculo.placa}"?`)) {
      deleteMutation.mutate(veiculo.id)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Veículos</h1>

        <PermissionGate codigo="veiculos.editar">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setImportModalOpen(true)}
              className="flex items-center gap-2 h-9 px-4 rounded-md border text-sm font-medium"
            >
              <Upload size={16} /> Importar CSV
            </button>
            <button
              onClick={handleNovo}
              className="flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium"
            >
              <Plus size={16} /> Novo Veículo
            </button>
          </div>
        </PermissionGate>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="p-3 border-b bg-muted/20">
          <input
            type="text"
            value={busca}
            onChange={(event) => {
              setBusca(event.target.value)
              setPage(1)
            }}
            placeholder="Buscar por placa, modelo ou marca..."
            className="w-full h-9 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-4 py-2 w-16">#</th>
              <th className="text-left font-medium px-4 py-2">
                <button
                  type="button"
                  onClick={() => alternarOrdenacao('placa')}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  Placa <IconeOrdenacao campo="placa" />
                </button>
              </th>
              <th className="text-left font-medium px-4 py-2">
                <button
                  type="button"
                  onClick={() => alternarOrdenacao('modelo')}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  Modelo <IconeOrdenacao campo="modelo" />
                </button>
              </th>
              <th className="text-left font-medium px-4 py-2">
                <button
                  type="button"
                  onClick={() => alternarOrdenacao('marca')}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  Marca <IconeOrdenacao campo="marca" />
                </button>
              </th>
              <th className="text-left font-medium px-4 py-2">
                <button
                  type="button"
                  onClick={() => alternarOrdenacao('clienteNome')}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  Cliente <IconeOrdenacao campo="clienteNome" />
                </button>
              </th>
              <th className="text-right font-medium px-4 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            )}

            {!isLoading && totalVeiculos === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  Nenhum veículo cadastrado
                </td>
              </tr>
            )}

            {!isLoading && totalVeiculos > 0 && veiculos.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  Nenhum veículo encontrado para a busca informada
                </td>
              </tr>
            )}

            {veiculos.map((veiculo, index) => (
              <tr key={veiculo.id} className="border-t hover:bg-muted/20">
                <td className="px-4 py-2 text-muted-foreground">{(page - 1) * pageSize + index + 1}</td>
                <td className="px-4 py-2 font-medium">{veiculo.placa}</td>
                <td className="px-4 py-2">{veiculo.modelo}</td>
                <td className="px-4 py-2">{veiculo.marca ?? '-'}</td>
                <td className="px-4 py-2">{veiculo.clienteNome ?? '-'}</td>
                <td className="px-4 py-2">
                  <div className="flex justify-end gap-1">
                    <PermissionGate codigo="veiculos.editar">
                      <button
                        onClick={() => handleEditar(veiculo)}
                        className="p-1.5 rounded hover:bg-muted"
                      >
                        <Pencil size={15} />
                      </button>
                    </PermissionGate>
                    <PermissionGate codigo="veiculos.excluir">
                      <button
                        onClick={() => handleExcluir(veiculo)}
                        className="p-1.5 rounded hover:bg-muted text-destructive"
                      >
                        <Trash2 size={15} />
                      </button>
                    </PermissionGate>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        totalItems={totalVeiculos}
        itemsMostrados={veiculos.length}
        itemLabel="veículos"
        onPageChange={setPage}
        onPageSizeChange={(novoTamanho) => {
          setPageSize(novoTamanho)
          setPage(1)
        }}
      />

      <VeiculoModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        veiculoExistente={veiculoEditando}
      />

      <ImportarVeiculosModal open={importModalOpen} onOpenChange={setImportModalOpen} />
    </div>
  )
}
