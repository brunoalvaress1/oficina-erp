import { useMemo, useState } from 'react'
import { ChevronDown, Plus, Pencil, Trash2, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { useClientes } from '../hooks/useClientes'
import { useDeleteCliente } from '../hooks/useClienteMutations'
import { ClienteModal } from '../components/ClienteModal'
import { PermissionGate } from '../components/PermissionGate'
import { formatCpfCnpj as showCpfCnpj } from '@/utils/format'
import { Pagination } from '@/components/ui/Pagination'
import type { CampoOrdenacaoCliente, Cliente, ListarClientesResult } from '../types/cliente'

export function ClientesList() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [busca, setBusca] = useState('')
  const [ordenacao, setOrdenacao] = useState<{ campo: CampoOrdenacaoCliente; direcao: 'asc' | 'desc' }>({
    campo: 'nome',
    direcao: 'asc',
  })

  function alternarOrdenacao(campo: CampoOrdenacaoCliente) {
    setOrdenacao((prev) =>
      prev.campo === campo
        ? { campo, direcao: prev.direcao === 'asc' ? 'desc' : 'asc' }
        : { campo, direcao: 'asc' },
    )
    setPage(1)
  }

  function IconeOrdenacao({ campo }: { campo: CampoOrdenacaoCliente }) {
    if (ordenacao.campo !== campo) return <ArrowUpDown size={13} className="opacity-40" />
    return ordenacao.direcao === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
  }

  const { data, isLoading } = useClientes({
    page,
    pageSize,
    search: busca,
    sortBy: ordenacao.campo,
    sortDirection: ordenacao.direcao,
  })
  const clientes: Cliente[] = (data as ListarClientesResult | undefined)?.data ?? []
  const totalClientes = (data as ListarClientesResult | undefined)?.total ?? 0
  const deleteMutation = useDeleteCliente()

  const [modalOpen, setModalOpen] = useState(false)
  const [clienteEditando, setClienteEditando] = useState<Cliente | undefined>()
  const [colunasOpen, setColunasOpen] = useState(false)
  const [colunasVisiveis, setColunasVisiveis] = useState({
    cpfCnpj: true,
    telefone: true,
    cidade: true,
    email: true,
    endereco: true,
    cep: true,
    codigoCidade: false,
  })

  const clientesFiltrados = clientes

  const totalColunas = useMemo(() => {
    let total = 2 // # + Nome
    if (colunasVisiveis.cpfCnpj) total += 1
    if (colunasVisiveis.telefone) total += 1
    if (colunasVisiveis.cidade) total += 1
    if (colunasVisiveis.email) total += 1
    if (colunasVisiveis.endereco) total += 1
    if (colunasVisiveis.cep) total += 1
    if (colunasVisiveis.codigoCidade) total += 1
    total += 1 // Ações
    return total
  }, [colunasVisiveis])

  function alternarColuna(coluna: keyof typeof colunasVisiveis) {
    setColunasVisiveis((prev) => ({ ...prev, [coluna]: !prev[coluna] }))
  }

  function handleNovo() {
    setClienteEditando(undefined)
    setModalOpen(true)
  }

  function handleEditar(cliente: Cliente) {
    setClienteEditando(cliente)
    setModalOpen(true)
  }

  function handleExcluir(cliente: Cliente) {
    if (confirm(`Excluir o cliente "${cliente.nome}"?`)) {
      deleteMutation.mutate(cliente.id)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clientes</h1>

        <PermissionGate codigo="clientes.editar">
          <button
            onClick={handleNovo}
            className="flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium"
          >
            <Plus size={16} /> Novo Cliente
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
              placeholder="Buscar por nome, CPF/CNPJ, email, endereço ou CEP..."
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
                      checked={colunasVisiveis.cpfCnpj}
                      onChange={() => alternarColuna('cpfCnpj')}
                    />
                    CPF/CNPJ
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
                      checked={colunasVisiveis.cidade}
                      onChange={() => alternarColuna('cidade')}
                    />
                    Cidade
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
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={colunasVisiveis.cep}
                      onChange={() => alternarColuna('cep')}
                    />
                    CEP
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={colunasVisiveis.codigoCidade}
                      onChange={() => alternarColuna('codigoCidade')}
                    />
                    Código Cidade (IBGE)
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
              {colunasVisiveis.cpfCnpj && (
                <th className="text-left font-medium px-4 py-2">
                  <button
                    type="button"
                    onClick={() => alternarOrdenacao('cpfCnpj')}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    CPF/CNPJ <IconeOrdenacao campo="cpfCnpj" />
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
              {colunasVisiveis.cidade && (
                <th className="text-left font-medium px-4 py-2">
                  <button
                    type="button"
                    onClick={() => alternarOrdenacao('cidade')}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    Cidade <IconeOrdenacao campo="cidade" />
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
              {colunasVisiveis.cep && (
                <th className="text-left font-medium px-4 py-2">
                  <button
                    type="button"
                    onClick={() => alternarOrdenacao('cep')}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    CEP <IconeOrdenacao campo="cep" />
                  </button>
                </th>
              )}
              {colunasVisiveis.codigoCidade && (
                <th className="text-left font-medium px-4 py-2">
                  <button
                    type="button"
                    onClick={() => alternarOrdenacao('codigoCidade')}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    Cód. Cidade (IBGE) <IconeOrdenacao campo="codigoCidade" />
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

            {!isLoading && totalClientes === 0 && (
              <tr>
                <td colSpan={totalColunas} className="px-4 py-6 text-center text-muted-foreground">
                  Nenhum cliente cadastrado
                </td>
              </tr>
            )}

            {!isLoading && totalClientes > 0 && clientesFiltrados.length === 0 && (
              <tr>
                <td colSpan={totalColunas} className="px-4 py-6 text-center text-muted-foreground">
                  Nenhum cliente encontrado para a busca informada
                </td>
              </tr>
            )}

            {clientesFiltrados.map((cliente, index) => (
              <tr key={cliente.id} className="border-t hover:bg-muted/20">
                <td className="px-4 py-2">{(page - 1) * pageSize + index + 1}</td>
                <td className="px-4 py-2">{cliente.nome}</td>
                {colunasVisiveis.cpfCnpj && (
                  <td className="px-4 py-2">{cliente.cpfCnpj ? showCpfCnpj(cliente.cpfCnpj) : '-'}</td>
                )}
                {colunasVisiveis.telefone && <td className="px-4 py-2">{cliente.telefone ?? '-'}</td>}
                {colunasVisiveis.cidade && <td className="px-4 py-2">{cliente.cidade ?? '-'}</td>}
                {colunasVisiveis.email && <td className="px-4 py-2">{cliente.email ?? '-'}</td>}
                {colunasVisiveis.endereco && (
                  <td className="px-4 py-2">
                    {cliente.endereco ? `${cliente.endereco}${cliente.numero ? `, ${cliente.numero}` : ''}` : '-'}
                  </td>
                )}
                {colunasVisiveis.cep && <td className="px-4 py-2">{cliente.cep ?? '-'}</td>}
                {colunasVisiveis.codigoCidade && (
                  <td className="px-4 py-2">{cliente.codigoCidade ?? '-'}</td>
                )}
                <td className="px-4 py-2">
                  <div className="flex justify-end gap-1">
                    <PermissionGate codigo="clientes.editar">
                      <button
                        onClick={() => handleEditar(cliente)}
                        className="p-1.5 rounded hover:bg-muted"
                      >
                        <Pencil size={15} />
                      </button>
                    </PermissionGate>
                    <PermissionGate codigo="clientes.excluir">
                      <button
                        onClick={() => handleExcluir(cliente)}
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
        totalItems={totalClientes}
        itemsMostrados={clientesFiltrados.length}
        itemLabel="clientes"
        onPageChange={setPage}
        onPageSizeChange={(novoTamanho) => {
          setPageSize(novoTamanho)
          setPage(1)
        }}
      />

      <ClienteModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        clienteExistente={clienteEditando}
      />
    </div>
  )
}