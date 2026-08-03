import { useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { formatCurrency, formatDate } from '@/utils/format'
import { Pagination } from '@/components/ui/Pagination'
import { ROTULO_FORMA_PAGAMENTO, type FormaPagamento } from '@/features/caixa/types/caixa'
import { ExportMenu } from '../components/ExportMenu'
import { ColumnVisibilityMenu } from '../components/ColumnVisibilityMenu'
import { useColunasVisiveis } from '../hooks/useColunasVisiveis'
import { useMovimentacoes } from '../hooks/useMovimentacoes'
import { ROTULO_ORIGEM_MOVIMENTACAO, type MovimentacaoFinanceira, type OrigemMovimentacao, type TipoMovimentacao } from '../types/movimentacaoFinanceira'
import type { ColunaExport } from '../services/exportService'

const COLUNAS_DISPONIVEIS = [
  { chave: 'data', titulo: 'Data' },
  { chave: 'descricao', titulo: 'Descrição' },
  { chave: 'tipo', titulo: 'Tipo' },
  { chave: 'origem', titulo: 'Origem' },
  { chave: 'conta', titulo: 'Conta Bancária' },
  { chave: 'forma', titulo: 'Forma Pagamento' },
  { chave: 'bruto', titulo: 'Valor Bruto' },
  { chave: 'taxa', titulo: 'Taxa' },
  { chave: 'liquido', titulo: 'Valor Líquido' },
  { chave: 'usuario', titulo: 'Usuário' },
]

const TIPOS: Array<{ valor: TipoMovimentacao | ''; rotulo: string }> = [
  { valor: '', rotulo: 'Todos' },
  { valor: 'entrada', rotulo: 'Entradas' },
  { valor: 'saida', rotulo: 'Saídas' },
]

const ORIGENS: OrigemMovimentacao[] = ['os', 'pdv', 'despesa_manual', 'receita_manual', 'ajuste', 'transferencia']

export function Movimentacoes() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(30)
  const [busca, setBusca] = useState('')
  const [buscaDebounced, setBuscaDebounced] = useState('')
  const [tipo, setTipo] = useState<TipoMovimentacao | ''>('')
  const [origem, setOrigem] = useState<OrigemMovimentacao | ''>('')

  const { visiveis, alternar } = useColunasVisiveis('movimentacoes', COLUNAS_DISPONIVEIS.map((c) => c.chave))

  const aplicarBusca = useDebouncedCallback((valor: string) => {
    setBuscaDebounced(valor)
    setPage(1)
  }, 300)

  const { data, isLoading } = useMovimentacoes({
    page,
    pageSize,
    search: buscaDebounced,
    tipo: tipo || undefined,
    origem: origem || undefined,
  })

  const movimentacoes = data?.data ?? []
  const total = data?.total ?? 0

  const colunasExport: ColunaExport<MovimentacaoFinanceira>[] = [
    { chave: 'data', titulo: 'Data', valor: (m) => formatDate(m.dataMovimentacao) },
    { chave: 'descricao', titulo: 'Descrição', valor: (m) => m.descricao },
    { chave: 'tipo', titulo: 'Tipo', valor: (m) => (m.tipo === 'entrada' ? 'Entrada' : 'Saída') },
    { chave: 'origem', titulo: 'Origem', valor: (m) => ROTULO_ORIGEM_MOVIMENTACAO[m.origem] },
    { chave: 'conta', titulo: 'Conta Bancária', valor: (m) => m.contaBancariaNome ?? '' },
    { chave: 'forma', titulo: 'Forma Pagamento', valor: (m) => (m.formaPagamento ? ROTULO_FORMA_PAGAMENTO[m.formaPagamento as FormaPagamento] : '') },
    { chave: 'bruto', titulo: 'Valor Bruto', valor: (m) => m.valorBruto },
    { chave: 'taxa', titulo: 'Taxa', valor: (m) => m.taxa },
    { chave: 'liquido', titulo: 'Valor Líquido', valor: (m) => m.valorLiquido },
    { chave: 'usuario', titulo: 'Usuário', valor: (m) => m.responsavelNome ?? m.createdAt },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-semibold">Movimentações</h1>
        <div className="flex items-center gap-2">
          <ColumnVisibilityMenu colunas={COLUNAS_DISPONIVEIS} visiveis={visiveis} onAlternar={alternar} />
          <ExportMenu linhas={movimentacoes} colunas={colunasExport.filter((c) => visiveis[c.chave] !== false)} nomeBase="movimentacoes" titulo="Movimentações Financeiras" />
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="p-3 border-b bg-muted/20 space-y-2">
          <input
            type="text"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value)
              aplicarBusca(e.target.value)
            }}
            placeholder="Buscar por descrição..."
            className="w-full h-9 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="flex flex-wrap gap-2">
            {TIPOS.map((t) => (
              <button
                key={t.valor}
                type="button"
                onClick={() => {
                  setTipo(t.valor)
                  setPage(1)
                }}
                className={`h-7 px-3 rounded-full text-xs font-medium border ${
                  tipo === t.valor ? 'bg-primary text-primary-foreground border-primary' : 'bg-background'
                }`}
              >
                {t.rotulo}
              </button>
            ))}
            <select
              value={origem}
              onChange={(e) => {
                setOrigem(e.target.value as OrigemMovimentacao | '')
                setPage(1)
              }}
              className="h-7 rounded-full border bg-background px-2 text-xs"
            >
              <option value="">Todas as origens</option>
              {ORIGENS.map((o) => (
                <option key={o} value={o}>
                  {ROTULO_ORIGEM_MOVIMENTACAO[o]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                {COLUNAS_DISPONIVEIS.filter((c) => visiveis[c.chave] !== false).map((coluna) => (
                  <th key={coluna.chave} className={`font-medium px-3 py-2 ${coluna.chave.includes('valor') || ['bruto', 'taxa', 'liquido'].includes(coluna.chave) ? 'text-right' : 'text-left'}`}>
                    {coluna.titulo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={COLUNAS_DISPONIVEIS.length} className="px-3 py-6 text-center text-muted-foreground">
                    Carregando...
                  </td>
                </tr>
              )}
              {!isLoading && total === 0 && (
                <tr>
                  <td colSpan={COLUNAS_DISPONIVEIS.length} className="px-3 py-6 text-center text-muted-foreground">
                    Nenhuma movimentação encontrada
                  </td>
                </tr>
              )}
              {movimentacoes.map((m) => (
                <tr key={m.id} className="border-t hover:bg-muted/20">
                  {visiveis.data !== false && <td className="px-3 py-2">{formatDate(m.dataMovimentacao)}</td>}
                  {visiveis.descricao !== false && <td className="px-3 py-2">{m.descricao}</td>}
                  {visiveis.tipo !== false && (
                    <td className="px-3 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${m.tipo === 'entrada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {m.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                  )}
                  {visiveis.origem !== false && <td className="px-3 py-2">{ROTULO_ORIGEM_MOVIMENTACAO[m.origem]}</td>}
                  {visiveis.conta !== false && <td className="px-3 py-2">{m.contaBancariaNome ?? '-'}</td>}
                  {visiveis.forma !== false && <td className="px-3 py-2">{m.formaPagamento ? ROTULO_FORMA_PAGAMENTO[m.formaPagamento as FormaPagamento] : '-'}</td>}
                  {visiveis.bruto !== false && <td className="px-3 py-2 text-right">{formatCurrency(m.valorBruto)}</td>}
                  {visiveis.taxa !== false && <td className="px-3 py-2 text-right">{formatCurrency(m.taxa)}</td>}
                  {visiveis.liquido !== false && <td className="px-3 py-2 text-right font-medium">{formatCurrency(m.valorLiquido)}</td>}
                  {visiveis.usuario !== false && <td className="px-3 py-2">{m.responsavelNome ?? '-'}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        totalItems={total}
        itemsMostrados={movimentacoes.length}
        itemLabel="movimentações"
        onPageChange={setPage}
        onPageSizeChange={(novoTamanho) => {
          setPageSize(novoTamanho)
          setPage(1)
        }}
      />
    </div>
  )
}
