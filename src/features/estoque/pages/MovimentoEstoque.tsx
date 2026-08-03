import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Plus, FileEdit, Download, Printer } from 'lucide-react'
import { useMovimentacoes } from '../hooks/useMovimentacoes'
import { listarMovimentacoes } from '../services/movimentacaoService'
import { useFuncionariosSelect } from '../hooks/useFuncionariosSelect'
import { useFornecedoresSelect } from '@/features/fornecedores/hooks/useFornecedoresSelect'
import { useProdutosBusca } from '@/features/produtos/hooks/useProdutosBusca'
import { Combobox } from '@/components/ui/Combobox'
import { Pagination } from '@/components/ui/Pagination'
import { PermissionGate } from '../components/PermissionGate'
import { formatDate } from '@/utils/format'
import { exportarCsv } from '@/utils/exportarCsv'
import { usePermissions } from '@/hooks/usePermissions'
import type { FornecedorSelect } from '@/features/fornecedores/types/fornecedor'
import type { Produto } from '@/features/produtos/types/produto'
import type { TipoMovimentacao } from '../types/movimentacao'

const ROTULOS_TIPO: Record<TipoMovimentacao, string> = {
  entrada: 'Entrada',
  saida: 'Saída',
  ajuste: 'Ajuste',
  transferencia: 'Transferência',
}

const CLASSES_TIPO: Record<TipoMovimentacao, string> = {
  entrada: 'bg-emerald-500/10 text-emerald-600',
  saida: 'bg-destructive/10 text-destructive',
  ajuste: 'bg-amber-500/10 text-amber-600',
  transferencia: 'bg-sky-500/10 text-sky-600',
}

const COLUNAS_PADRAO = {
  produto: true,
  quantidade: true,
  tipo: true,
  nota: true,
  usuario: true,
  estoque: true,
  observacao: false,
}

type ColunasVisiveis = typeof COLUNAS_PADRAO

function carregarColunasSalvas(chave: string): ColunasVisiveis {
  try {
    const salvo = localStorage.getItem(chave)
    if (!salvo) return COLUNAS_PADRAO
    return { ...COLUNAS_PADRAO, ...JSON.parse(salvo) }
  } catch {
    return COLUNAS_PADRAO
  }
}

export function MovimentoEstoque() {
  const navigate = useNavigate()
  const { funcionario } = usePermissions()
  const chaveColunas = `estoque_movimentacao_colunas_${funcionario?.id ?? 'default'}`

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [tipo, setTipo] = useState<TipoMovimentacao | ''>('')
  const [numeroNota, setNumeroNota] = useState('')
  const [fornecedor, setFornecedor] = useState<FornecedorSelect | null>(null)
  const [termoBuscaFornecedor, setTermoBuscaFornecedor] = useState('')
  const [produto, setProduto] = useState<Produto | null>(null)
  const [termoBuscaProduto, setTermoBuscaProduto] = useState('')
  const [funcionarioId, setFuncionarioId] = useState('')
  const [opcoesOpen, setOpcoesOpen] = useState(false)
  const [colunasOpen, setColunasOpen] = useState(false)
  const [colunas, setColunas] = useState<ColunasVisiveis>(() => carregarColunasSalvas(chaveColunas))

  useEffect(() => {
    localStorage.setItem(chaveColunas, JSON.stringify(colunas))
  }, [colunas, chaveColunas])

  const { data, isLoading } = useMovimentacoes({
    page,
    pageSize,
    tipo: tipo || undefined,
    produtoId: produto?.id,
    fornecedorId: fornecedor?.id,
    numeroNota: numeroNota || undefined,
    funcionarioId: funcionarioId || undefined,
    dataInicio: dataInicio || undefined,
    dataFim: dataFim || undefined,
  })

  const { data: fornecedoresEncontrados = [], isLoading: buscandoFornecedores } = useFornecedoresSelect(termoBuscaFornecedor)
  const { data: produtosEncontrados = [], isLoading: buscandoProdutos } = useProdutosBusca(termoBuscaProduto)
  const { data: funcionarios = [] } = useFuncionariosSelect()

  const movimentacoes = data?.data ?? []
  const total = data?.total ?? 0

  function alternarColuna(coluna: keyof ColunasVisiveis) {
    setColunas((prev) => ({ ...prev, [coluna]: !prev[coluna] }))
  }

  const totalColunas = useMemo(() => {
    let n = 1 // Data sempre visível
    for (const visivel of Object.values(colunas)) if (visivel) n += 1
    return n
  }, [colunas])

  async function handleExportarCsv() {
    const tudo = await listarMovimentacoes({
      page: 1,
      pageSize: 5000,
      tipo: tipo || undefined,
      produtoId: produto?.id,
      fornecedorId: fornecedor?.id,
      numeroNota: numeroNota || undefined,
      funcionarioId: funcionarioId || undefined,
      dataInicio: dataInicio || undefined,
      dataFim: dataFim || undefined,
    })
    exportarCsv(
      `movimento-estoque-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Data', 'Produto', 'Quantidade', 'Tipo', 'Nota Fiscal', 'Usuário', 'Estoque Anterior', 'Estoque Resultante', 'Observação'],
      tudo.data.map((m) => [
        formatDate(m.createdAt),
        m.produtoNome ?? '',
        m.quantidade,
        ROTULOS_TIPO[m.tipo],
        m.numeroNota ?? '',
        m.funcionarioNome ?? '',
        m.quantidadeAnterior,
        m.quantidadeResultante,
        m.observacao ?? '',
      ]),
    )
    setOpcoesOpen(false)
  }

  function handleImprimir() {
    setOpcoesOpen(false)
    window.print()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Estoque</h1>

        <PermissionGate codigo="estoque.editar">
          <div className="flex items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={() => navigate('/estoque/notas')}
              className="flex items-center gap-2 h-9 px-4 rounded-md border text-sm font-medium"
            >
              <FileEdit size={16} /> Editar Nota Fiscal
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpcoesOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 h-9 px-3 rounded-md border bg-background text-sm"
              >
                Opções <ChevronDown size={14} />
              </button>
              {opcoesOpen && (
                <div className="absolute right-0 mt-1 w-56 rounded-md border bg-background shadow-md p-1 z-20 text-sm">
                  <button
                    type="button"
                    onClick={handleExportarCsv}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-muted text-left"
                  >
                    <Download size={14} /> Exportar CSV / Excel
                  </button>
                  <button
                    type="button"
                    onClick={handleImprimir}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-muted text-left"
                  >
                    <Printer size={14} /> Imprimir / Exportar PDF
                  </button>
                  <div className="border-t my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      setColunasOpen((prev) => !prev)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-muted text-left"
                  >
                    Mostrar/Ocultar Colunas
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => navigate('/estoque/lancar')}
              className="flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium"
            >
              <Plus size={16} /> Lançar Estoque
            </button>
          </div>
        </PermissionGate>
      </div>

      <div className="rounded-lg border p-3 space-y-3 print:hidden">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Período (início)</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => {
                setDataInicio(e.target.value)
                setPage(1)
              }}
              className="w-full h-9 rounded-md border bg-background px-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Período (fim)</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => {
                setDataFim(e.target.value)
                setPage(1)
              }}
              className="w-full h-9 rounded-md border bg-background px-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Fornecedor</label>
            <Combobox<FornecedorSelect>
              value={fornecedor}
              onSelect={(f) => {
                setFornecedor(f)
                setPage(1)
              }}
              onSearch={setTermoBuscaFornecedor}
              items={fornecedoresEncontrados}
              isLoading={buscandoFornecedores}
              getKey={(f) => f.id}
              getLabel={(f) => f.nome}
              placeholder="Todos"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Produto</label>
            <Combobox<Produto>
              value={produto}
              onSelect={(p) => {
                setProduto(p)
                setPage(1)
              }}
              onSearch={setTermoBuscaProduto}
              items={produtosEncontrados}
              isLoading={buscandoProdutos}
              getKey={(p) => p.id}
              getLabel={(p) => p.nome}
              placeholder="Todos"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Nota Fiscal</label>
            <input
              value={numeroNota}
              onChange={(e) => {
                setNumeroNota(e.target.value)
                setPage(1)
              }}
              placeholder="Número"
              className="w-full h-9 rounded-md border bg-background px-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Usuário</label>
            <select
              value={funcionarioId}
              onChange={(e) => {
                setFuncionarioId(e.target.value)
                setPage(1)
              }}
              className="w-full h-9 rounded-md border bg-background px-2 text-sm"
            >
              <option value="">Todos</option>
              {funcionarios.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Tipo</label>
            <select
              value={tipo}
              onChange={(e) => {
                setTipo(e.target.value as TipoMovimentacao | '')
                setPage(1)
              }}
              className="h-9 rounded-md border bg-background px-2 text-sm"
            >
              <option value="">Todos</option>
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
              <option value="ajuste">Ajuste</option>
              <option value="transferencia">Transferência</option>
            </select>
          </div>

          {colunasOpen && (
            <div className="ml-auto flex flex-wrap gap-3 text-sm border rounded-md p-2 bg-muted/20">
              {(Object.keys(COLUNAS_PADRAO) as (keyof ColunasVisiveis)[]).map((coluna) => (
                <label key={coluna} className="flex items-center gap-1.5 capitalize">
                  <input type="checkbox" checked={colunas[coluna]} onChange={() => alternarColuna(coluna)} />
                  {coluna}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-4 py-2">Data</th>
              {colunas.produto && <th className="text-left font-medium px-4 py-2">Produto</th>}
              {colunas.quantidade && <th className="text-left font-medium px-4 py-2">Quantidade</th>}
              {colunas.tipo && <th className="text-left font-medium px-4 py-2">Tipo</th>}
              {colunas.nota && <th className="text-left font-medium px-4 py-2">Nota</th>}
              {colunas.usuario && <th className="text-left font-medium px-4 py-2">Usuário</th>}
              {colunas.estoque && <th className="text-left font-medium px-4 py-2">Estoque (antes → depois)</th>}
              {colunas.observacao && <th className="text-left font-medium px-4 py-2">Observação</th>}
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

            {!isLoading && movimentacoes.length === 0 && (
              <tr>
                <td colSpan={totalColunas} className="px-4 py-6 text-center text-muted-foreground">
                  Nenhuma movimentação encontrada
                </td>
              </tr>
            )}

            {movimentacoes.map((m) => (
              <tr key={m.id} className="border-t hover:bg-muted/20">
                <td className="px-4 py-2 whitespace-nowrap">{formatDate(m.createdAt)}</td>
                {colunas.produto && <td className="px-4 py-2 font-medium">{m.produtoNome ?? '-'}</td>}
                {colunas.quantidade && (
                  <td className="px-4 py-2">{m.quantidade > 0 ? `+${m.quantidade}` : m.quantidade}</td>
                )}
                {colunas.tipo && (
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CLASSES_TIPO[m.tipo]}`}>
                      {ROTULOS_TIPO[m.tipo]}
                    </span>
                  </td>
                )}
                {colunas.nota && <td className="px-4 py-2">{m.numeroNota ?? '-'}</td>}
                {colunas.usuario && <td className="px-4 py-2">{m.funcionarioNome ?? '-'}</td>}
                {colunas.estoque && (
                  <td className="px-4 py-2 text-muted-foreground">
                    {m.quantidadeAnterior} → {m.quantidadeResultante}
                  </td>
                )}
                {colunas.observacao && <td className="px-4 py-2 text-muted-foreground">{m.observacao ?? '-'}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="print:hidden">
        <Pagination
          page={page}
          pageSize={pageSize}
          totalItems={total}
          itemsMostrados={movimentacoes.length}
          itemLabel="movimentações"
          pageSizeOptions={[10, 25, 50, 100]}
          onPageChange={setPage}
          onPageSizeChange={(novoTamanho) => {
            setPageSize(novoTamanho)
            setPage(1)
          }}
        />
      </div>
    </div>
  )
}
