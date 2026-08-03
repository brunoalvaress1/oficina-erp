import { useMemo, useState } from 'react'
import { ChevronDown, Plus, Pencil, Trash2, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { useFornecedores } from '../hooks/useFornecedores'
import { useDeleteFornecedor } from '../hooks/useFornecedorMutations'
import { FornecedorModal } from '../components/FornecedorModal'
import { PermissionGate } from '../components/PermissionGate'
import { formatCpfCnpj as showCpfCnpj } from '@/utils/format'
import { Pagination } from '@/components/ui/Pagination'
import type { CampoOrdenacaoFornecedor, Fornecedor } from '../types/fornecedor'

export function FornecedoresList() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [busca, setBusca] = useState('')
  const [ordenacao, setOrdenacao] = useState<{ campo: CampoOrdenacaoFornecedor; direcao: 'asc' | 'desc' }>({
    campo: 'nome',
    direcao: 'asc',
  })

  function alternarOrdenacao(campo: CampoOrdenacaoFornecedor) {
    setOrdenacao((prev) =>
      prev.campo === campo
        ? { campo, direcao: prev.direcao === 'asc' ? 'desc' : 'asc' }
        : { campo, direcao: 'asc' },
    )
    setPage(1)
  }

  function IconeOrdenacao({ campo }: { campo: CampoOrdenacaoFornecedor }) {
    if (ordenacao.campo !== campo) return <ArrowUpDown size={13} className="opacity-40" />
    return ordenacao.direcao === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
  }

  const { data, isLoading } = useFornecedores({
    page,
    pageSize,
    search: busca,
    sortBy: ordenacao.campo,
    sortDirection: ordenacao.direcao,
  })
  const fornecedores: Fornecedor[] = data?.data ?? []
  const totalFornecedores = data?.total ?? 0
  const deleteMutation = useDeleteFornecedor()

  const [modalOpen, setModalOpen] = useState(false)
  const [fornecedorEditando, setFornecedorEditando] = useState<Fornecedor | undefined>()
  const [colunasOpen, setColunasOpen] = useState(false)
  const [colunasVisiveis, setColunasVisiveis] = useState({
    cnpjCpf: true,
    vendedor: true,
    telefone: true,
    email: true,
    endereco: true,
  })

  const totalColunas = useMemo(() => {
    let total = 2 // # + Nome
    if (colunasVisiveis.cnpjCpf) total += 1
    if (colunasVisiveis.vendedor) total += 1
    if (colunasVisiveis.telefone) total += 1
    if (colunasVisiveis.email) total += 1
    if (colunasVisiveis.endereco) total += 1
    total += 1 // Ações
    return total
  }, [colunasVisiveis])

  function alternarColuna(coluna: keyof typeof colunasVisiveis) {
    setColunasVisiveis((prev) => ({ ...prev, [coluna]: !prev[coluna] }))
  }

  function handleNovo() {
    setFornecedorEditando(undefined)
    setModalOpen(true)
  }

  function handleEditar(fornecedor: Fornecedor) {
    setFornecedorEditando(fornecedor)
    setModalOpen(true)
  }

  function handleExcluir(fornecedor: Fornecedor) {
    if (confirm(`Excluir o fornecedor "${fornecedor.nome}"?`)) {
      deleteMutation.mutate(fornecedor.id)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Fornecedores</h1>

        <PermissionGate codigo="estoque.editar">
          <button
            onClick={handleNovo}
            className="flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium"
          >
            <Plus size={16} /> Novo Fornecedor
          </button>
        </PermissionGate>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="p-3 border-b bg-muted/20">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={busca}
              onChange={(event) => {
                setBusca(event.target.value)
                setPage(1)
              }}
              placeholder="Buscar por nome, CNPJ/CPF, email, telefone ou vendedor..."
              className="w-full h-9 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
            <div className="relative">
              <button
                type="button"
                onClick={() => setColunasOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 h-9 px-3 rounded-md border bg-background text-sm"
              >
                Colunas <ChevronDown size={14} />
              </button>

              {colunasOpen && (
                <div className="absolute right-0 mt-1 w-56 rounded-md border bg-background shadow-md p-2 z-10 space-y-1 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={colunasVisiveis.cnpjCpf}
                      onChange={() => alternarColuna('cnpjCpf')}
                    />
                    CNPJ/CPF
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={colunasVisiveis.vendedor}
                      onChange={() => alternarColuna('vendedor')}
                    />
                    Vendedor
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={colunasVisiveis.telefone}
                      onChange={() => alternarColuna('telefone')}
                    />
                    Telefone
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={colunasVisiveis.email}
                      onChange={() => alternarColuna('email')}
                    />
                    Email
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={colunasVisiveis.endereco}
                      onChange={() => alternarColuna('endereco')}
                    />
                    Endereço
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-4 py-2 w-16">#</th>
              <th className="text-left font-medium px-4 py-2">
                <button
                  type="button"
                  onClick={() => alternarOrdenacao('nome')}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  Nome <IconeOrdenacao campo="nome" />
                </button>
              </th>
              {colunasVisiveis.cnpjCpf && (
                <th className="text-left font-medium px-4 py-2">
                  <button
                    type="button"
                    onClick={() => alternarOrdenacao('cnpjCpf')}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    CNPJ/CPF <IconeOrdenacao campo="cnpjCpf" />
                  </button>
                </th>
              )}
              {colunasVisiveis.vendedor && (
                <th className="text-left font-medium px-4 py-2">
                  <button
                    type="button"
                    onClick={() => alternarOrdenacao('vendedor')}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    Vendedor <IconeOrdenacao campo="vendedor" />
                  </button>
                </th>
              )}
              {colunasVisiveis.telefone && (
                <th className="text-left font-medium px-4 py-2">
                  <button
                    type="button"
                    onClick={() => alternarOrdenacao('telefone')}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    Telefone <IconeOrdenacao campo="telefone" />
                  </button>
                </th>
              )}
              {colunasVisiveis.email && (
                <th className="text-left font-medium px-4 py-2">
                  <button
                    type="button"
                    onClick={() => alternarOrdenacao('email')}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    Email <IconeOrdenacao campo="email" />
                  </button>
                </th>
              )}
              {colunasVisiveis.endereco && (
                <th className="text-left font-medium px-4 py-2">
                  <button
                    type="button"
                    onClick={() => alternarOrdenacao('endereco')}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    Endereço <IconeOrdenacao campo="endereco" />
                  </button>
                </th>
              )}
              <th className="text-right font-medium px-4 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={totalColunas} className="px-4 py-6 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            )}

            {!isLoading && totalFornecedores === 0 && (
              <tr>
                <td colSpan={totalColunas} className="px-4 py-6 text-center text-muted-foreground">
                  Nenhum fornecedor cadastrado
                </td>
              </tr>
            )}

            {!isLoading && totalFornecedores > 0 && fornecedores.length === 0 && (
              <tr>
                <td colSpan={totalColunas} className="px-4 py-6 text-center text-muted-foreground">
                  Nenhum fornecedor encontrado para a busca informada
                </td>
              </tr>
            )}

            {fornecedores.map((fornecedor, index) => (
              <tr key={fornecedor.id} className="border-t hover:bg-muted/20">
                <td className="px-4 py-2">{(page - 1) * pageSize + index + 1}</td>
                <td className="px-4 py-2">{fornecedor.nome}</td>
                {colunasVisiveis.cnpjCpf && (
                  <td className="px-4 py-2">{fornecedor.cnpjCpf ? showCpfCnpj(fornecedor.cnpjCpf) : '-'}</td>
                )}
                {colunasVisiveis.vendedor && <td className="px-4 py-2">{fornecedor.vendedor ?? '-'}</td>}
                {colunasVisiveis.telefone && <td className="px-4 py-2">{fornecedor.telefone ?? '-'}</td>}
                {colunasVisiveis.email && <td className="px-4 py-2">{fornecedor.email ?? '-'}</td>}
                {colunasVisiveis.endereco && <td className="px-4 py-2">{fornecedor.endereco ?? '-'}</td>}
                <td className="px-4 py-2">
                  <div className="flex justify-end gap-1">
                    <PermissionGate codigo="estoque.editar">
                      <button
                        onClick={() => handleEditar(fornecedor)}
                        className="p-1.5 rounded hover:bg-muted"
                      >
                        <Pencil size={15} />
                      </button>
                    </PermissionGate>
                    <PermissionGate codigo="estoque.editar">
                      <button
                        onClick={() => handleExcluir(fornecedor)}
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
        totalItems={totalFornecedores}
        itemsMostrados={fornecedores.length}
        itemLabel="fornecedores"
        onPageChange={setPage}
        onPageSizeChange={(novoTamanho) => {
          setPageSize(novoTamanho)
          setPage(1)
        }}
      />

      <FornecedorModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        fornecedorExistente={fornecedorEditando}
      />
    </div>
  )
}
