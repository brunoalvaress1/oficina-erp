import { useMemo, useState } from 'react'
import { ChevronDown, Plus, Pencil, Trash2, Upload, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { useProdutos } from '../hooks/useProdutos'
import { useDeleteProduto } from '../hooks/useProdutoMutations'
import { ProdutoModal } from '../components/ProdutoModal'
import { ImportarProdutosModal } from '../components/ImportarProdutosModal'
import { PermissionGate } from '../components/PermissionGate'
import { Pagination } from '@/components/ui/Pagination'
import { formatCurrency } from '@/utils/format'
import { usePermissions } from '@/hooks/usePermissions'
import type { CampoOrdenacaoProduto, ListarProdutosResult, Produto } from '../types/produto'

function calcularMargem(produto: Produto): number | null {
  if (!produto.valorCusto || !produto.valorOs) return null
  return ((produto.valorOs - produto.valorCusto) / produto.valorCusto) * 100
}

export function ProdutosList() {
  const { hasPermission } = usePermissions()
  const podeVerLucro = hasPermission('estoque.visualizar_lucro')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [busca, setBusca] = useState('')
  const [ordenacao, setOrdenacao] = useState<{ campo: CampoOrdenacaoProduto; direcao: 'asc' | 'desc' }>({
    campo: 'nome',
    direcao: 'asc',
  })

  const { data, isLoading } = useProdutos({
    page,
    pageSize,
    search: busca,
    sortBy: ordenacao.campo,
    sortDirection: ordenacao.direcao,
  })
  const produtos: Produto[] = (data as ListarProdutosResult | undefined)?.data ?? []
  const totalProdutos = (data as ListarProdutosResult | undefined)?.total ?? 0
  const deleteMutation = useDeleteProduto()

  const [modalOpen, setModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [produtoEditando, setProdutoEditando] = useState<Produto | undefined>()
  const [colunasOpen, setColunasOpen] = useState(false)
  const [colunasVisiveis, setColunasVisiveis] = useState({
    categoria: true,
    marca: true,
    valorCusto: true,
    valorOs: true,
    margem: true,
    estoqueFisico: true,
  })

  const totalColunas = useMemo(() => {
    let total = 2 // # + Nome
    if (colunasVisiveis.categoria) total += 1
    if (colunasVisiveis.marca) total += 1
    if (colunasVisiveis.valorCusto) total += 1
    if (colunasVisiveis.valorOs) total += 1
    if (colunasVisiveis.margem && podeVerLucro) total += 1
    if (colunasVisiveis.estoqueFisico) total += 1
    total += 1 // Ações
    return total
  }, [colunasVisiveis, podeVerLucro])

  function alternarColuna(coluna: keyof typeof colunasVisiveis) {
    setColunasVisiveis((prev) => ({ ...prev, [coluna]: !prev[coluna] }))
  }

  function alternarOrdenacao(campo: CampoOrdenacaoProduto) {
    setOrdenacao((prev) =>
      prev.campo === campo
        ? { campo, direcao: prev.direcao === 'asc' ? 'desc' : 'asc' }
        : { campo, direcao: 'asc' },
    )
    setPage(1)
  }

  function IconeOrdenacao({ campo }: { campo: CampoOrdenacaoProduto }) {
    if (ordenacao.campo !== campo) return <ArrowUpDown size={13} className="opacity-40" />
    return ordenacao.direcao === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
  }

  function handleNovo() {
    setProdutoEditando(undefined)
    setModalOpen(true)
  }

  function handleEditar(produto: Produto) {
    setProdutoEditando(produto)
    setModalOpen(true)
  }

  function handleExcluir(produto: Produto) {
    if (confirm(`Excluir o produto "${produto.nome}"?`)) {
      deleteMutation.mutate(produto.id)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Produtos</h1>

        <PermissionGate codigo="produtos.editar">
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
              <Plus size={16} /> Novo Produto
            </button>
          </div>
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
              placeholder="Buscar por nome, categoria, marca, NCM ou código..."
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
                      checked={colunasVisiveis.categoria}
                      onChange={() => alternarColuna('categoria')}
                    />
                    Categoria
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={colunasVisiveis.marca}
                      onChange={() => alternarColuna('marca')}
                    />
                    Marca
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={colunasVisiveis.valorCusto}
                      onChange={() => alternarColuna('valorCusto')}
                    />
                    Valor Custo
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={colunasVisiveis.valorOs}
                      onChange={() => alternarColuna('valorOs')}
                    />
                    Valor O.S.
                  </label>
                  {podeVerLucro && (
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={colunasVisiveis.margem}
                        onChange={() => alternarColuna('margem')}
                      />
                      Margem
                    </label>
                  )}
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={colunasVisiveis.estoqueFisico}
                      onChange={() => alternarColuna('estoqueFisico')}
                    />
                    Estoque Físico
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
              {colunasVisiveis.categoria && (
                <th className="text-left font-medium px-4 py-2">
                  <button
                    type="button"
                    onClick={() => alternarOrdenacao('categoria')}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    Categoria <IconeOrdenacao campo="categoria" />
                  </button>
                </th>
              )}
              {colunasVisiveis.marca && (
                <th className="text-left font-medium px-4 py-2">
                  <button
                    type="button"
                    onClick={() => alternarOrdenacao('marca')}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    Marca <IconeOrdenacao campo="marca" />
                  </button>
                </th>
              )}
              {colunasVisiveis.valorCusto && (
                <th className="text-left font-medium px-4 py-2">
                  <button
                    type="button"
                    onClick={() => alternarOrdenacao('valorCusto')}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    Valor Custo <IconeOrdenacao campo="valorCusto" />
                  </button>
                </th>
              )}
              {colunasVisiveis.valorOs && (
                <th className="text-left font-medium px-4 py-2">
                  <button
                    type="button"
                    onClick={() => alternarOrdenacao('valorOs')}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    Valor O.S. <IconeOrdenacao campo="valorOs" />
                  </button>
                </th>
              )}
              {colunasVisiveis.margem && podeVerLucro && (
                <th className="text-left font-medium px-4 py-2">Margem</th>
              )}
              {colunasVisiveis.estoqueFisico && (
                <th className="text-left font-medium px-4 py-2">
                  <button
                    type="button"
                    onClick={() => alternarOrdenacao('estoqueFisico')}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    Est. Físico <IconeOrdenacao campo="estoqueFisico" />
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

            {!isLoading && totalProdutos === 0 && (
              <tr>
                <td colSpan={totalColunas} className="px-4 py-6 text-center text-muted-foreground">
                  Nenhum produto cadastrado
                </td>
              </tr>
            )}

            {!isLoading && totalProdutos > 0 && produtos.length === 0 && (
              <tr>
                <td colSpan={totalColunas} className="px-4 py-6 text-center text-muted-foreground">
                  Nenhum produto encontrado para a busca informada
                </td>
              </tr>
            )}

            {produtos.map((produto, index) => (
              <tr key={produto.id} className="border-t hover:bg-muted/20">
                <td className="px-4 py-2 text-muted-foreground">{(page - 1) * pageSize + index + 1}</td>
                <td className="px-4 py-2 font-medium">{produto.nome}</td>
                {colunasVisiveis.categoria && <td className="px-4 py-2">{produto.categoria ?? '-'}</td>}
                {colunasVisiveis.marca && <td className="px-4 py-2">{produto.marca ?? '-'}</td>}
                {colunasVisiveis.valorCusto && <td className="px-4 py-2">{formatCurrency(produto.valorCusto)}</td>}
                {colunasVisiveis.valorOs && <td className="px-4 py-2">{formatCurrency(produto.valorOs)}</td>}
                {colunasVisiveis.margem && podeVerLucro && (
                  <td className="px-4 py-2">
                    {calcularMargem(produto) !== null ? `${calcularMargem(produto)!.toFixed(0)}%` : '-'}
                  </td>
                )}
                {colunasVisiveis.estoqueFisico && <td className="px-4 py-2">{produto.estoqueFisico}</td>}
                <td className="px-4 py-2">
                  <div className="flex justify-end gap-1">
                    <PermissionGate codigo="produtos.editar">
                      <button onClick={() => handleEditar(produto)} className="p-1.5 rounded hover:bg-muted">
                        <Pencil size={15} />
                      </button>
                    </PermissionGate>
                    <PermissionGate codigo="produtos.excluir">
                      <button
                        onClick={() => handleExcluir(produto)}
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
        totalItems={totalProdutos}
        itemsMostrados={produtos.length}
        itemLabel="produtos"
        onPageChange={setPage}
        onPageSizeChange={(novoTamanho) => {
          setPageSize(novoTamanho)
          setPage(1)
        }}
      />

      <ProdutoModal open={modalOpen} onOpenChange={setModalOpen} produtoExistente={produtoEditando} />

      <ImportarProdutosModal open={importModalOpen} onOpenChange={setImportModalOpen} />
    </div>
  )
}
