import { useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { Plus, Pencil } from 'lucide-react'
import { Pagination } from '@/components/ui/Pagination'
import { formatDate } from '@/utils/format'
import { PermissionGate } from '../components/PermissionGate'
import { FuncionarioModal } from '../components/FuncionarioModal'
import { useFuncionarios } from '../hooks/useFuncionarios'
import { useAtualizarFuncionario } from '../hooks/useFuncionarioMutations'
import type { Funcionario } from '../types/funcionario'

export function FuncionariosList() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [busca, setBusca] = useState('')
  const [buscaDebounced, setBuscaDebounced] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [funcionarioEditando, setFuncionarioEditando] = useState<Funcionario | null>(null)

  const aplicarBusca = useDebouncedCallback((valor: string) => {
    setBuscaDebounced(valor)
    setPage(1)
  }, 300)

  const { data, isLoading } = useFuncionarios({ page, pageSize, search: buscaDebounced })
  const atualizar = useAtualizarFuncionario()

  const funcionarios = data?.data ?? []
  const total = data?.total ?? 0

  function handleNovo() {
    setFuncionarioEditando(null)
    setModalAberto(true)
  }

  function handleEditar(funcionario: Funcionario) {
    setFuncionarioEditando(funcionario)
    setModalAberto(true)
  }

  function handleAlternarAtivo(funcionario: Funcionario) {
    atualizar.mutate({ id: funcionario.id, alteracoes: { ativo: !funcionario.ativo } })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-semibold">Funcionários</h1>
        <PermissionGate codigo="funcionarios.criar">
          <button
            type="button"
            onClick={handleNovo}
            className="flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium"
          >
            <Plus size={15} /> Novo Funcionário
          </button>
        </PermissionGate>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="p-3 border-b bg-muted/20">
          <input
            type="text"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value)
              aplicarBusca(e.target.value)
            }}
            placeholder="Buscar por nome, cargo ou e-mail..."
            className="w-full h-9 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-3 py-2">Nome</th>
              <th className="text-left font-medium px-3 py-2">Cargo</th>
              <th className="text-left font-medium px-3 py-2">E-mail</th>
              <th className="text-left font-medium px-3 py-2">Permissões</th>
              <th className="text-left font-medium px-3 py-2">Desde</th>
              <th className="text-left font-medium px-3 py-2">Status</th>
              <th className="text-right font-medium px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            )}
            {!isLoading && total === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                  Nenhum funcionário encontrado
                </td>
              </tr>
            )}
            {funcionarios.map((funcionario) => (
              <tr key={funcionario.id} className="border-t hover:bg-muted/20">
                <td className="px-3 py-2 font-medium">{funcionario.nome}</td>
                <td className="px-3 py-2">{funcionario.cargo ?? '-'}</td>
                <td className="px-3 py-2">{funcionario.email ?? '-'}</td>
                <td className="px-3 py-2">{funcionario.quantidadePermissoes ?? 0}</td>
                <td className="px-3 py-2">{formatDate(funcionario.createdAt)}</td>
                <td className="px-3 py-2">
                  <PermissionGate
                    codigo="funcionarios.editar"
                    fallback={<span className="text-xs">{funcionario.ativo ? 'Ativo' : 'Inativo'}</span>}
                  >
                    <button
                      type="button"
                      onClick={() => handleAlternarAtivo(funcionario)}
                      className={`text-xs px-2 py-0.5 rounded-full ${funcionario.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                    >
                      {funcionario.ativo ? 'Ativo' : 'Inativo'}
                    </button>
                  </PermissionGate>
                </td>
                <td className="px-3 py-2 text-right">
                  <PermissionGate codigo="funcionarios.editar">
                    <button
                      type="button"
                      onClick={() => handleEditar(funcionario)}
                      title="Editar"
                      className="h-7 w-7 flex items-center justify-center rounded-md border ml-auto"
                    >
                      <Pencil size={13} />
                    </button>
                  </PermissionGate>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        totalItems={total}
        itemsMostrados={funcionarios.length}
        itemLabel="funcionários"
        onPageChange={setPage}
        onPageSizeChange={(novoTamanho) => {
          setPageSize(novoTamanho)
          setPage(1)
        }}
      />

      <FuncionarioModal funcionario={funcionarioEditando} open={modalAberto} onOpenChange={setModalAberto} />
    </div>
  )
}
