import { useState } from 'react'
import { DollarSign, TrendingUp, TrendingDown, Wallet, Receipt, ShoppingCart, Store, AlertCircle, Target } from 'lucide-react'
import { formatCurrency } from '@/utils/format'
import { CampoMoeda } from '@/components/ui/CampoMoeda'
import { FiltroFinanceiroBar } from '../components/FiltroFinanceiroBar'
import { CardIndicador } from '../components/CardIndicador'
import { AlertasFinanceiros } from '../components/AlertasFinanceiros'
import { GraficoReceitaDespesa } from '../components/GraficoReceitaDespesa'
import { GraficoPorFormaPagamento } from '../components/GraficoPorFormaPagamento'
import { GraficoPorCategoria } from '../components/GraficoPorCategoria'
import { GraficoPorResponsavel } from '../components/GraficoPorResponsavel'
import { GraficoLucroMensal } from '../components/GraficoLucroMensal'
import { GraficoReceitasAnuais } from '../components/GraficoReceitasAnuais'
import {
  useCardsDashboard,
  usePorCategoriaFinanceiro,
  usePorFormaPagamentoFinanceiro,
  usePorResponsavelFinanceiro,
  useResumoEstoqueFinanceiro,
  useSerieDiariaFinanceiro,
  useSerieMensalFinanceiro,
  useTopClientesFinanceiro,
  useTopProdutosFinanceiro,
  useTopServicosFinanceiro,
} from '../hooks/useDashboardFinanceiro'
import { useDefinirMetaDoMes, useMetaDoMes } from '../hooks/useMetaFinanceira'
import { criarFiltroFinanceiroPadrao, type FiltroFinanceiro } from '../types/filtroFinanceiro'

export function DashboardFinanceiro() {
  const [filtro, setFiltro] = useState<FiltroFinanceiro>(criarFiltroFinanceiroPadrao())
  const [modoResponsavel, setModoResponsavel] = useState<'mecanico' | 'vendedor'>('vendedor')
  const [modoSerie, setModoSerie] = useState<'lucro' | 'receita'>('lucro')
  const [abaTop, setAbaTop] = useState<'clientes' | 'produtos' | 'servicos'>('clientes')

  const { data: cards } = useCardsDashboard(filtro)
  const { data: serieDiaria, isLoading: carregandoSerie } = useSerieDiariaFinanceiro(filtro)
  const { data: porForma, isLoading: carregandoForma } = usePorFormaPagamentoFinanceiro(filtro)
  const { data: porCategoria, isLoading: carregandoCategoria } = usePorCategoriaFinanceiro(filtro)
  const { data: porResponsavel, isLoading: carregandoResponsavel } = usePorResponsavelFinanceiro(filtro, modoResponsavel)
  const { data: serieMensal, isLoading: carregandoMensal } = useSerieMensalFinanceiro(12)
  const { data: topClientes } = useTopClientesFinanceiro(filtro)
  const { data: topProdutos } = useTopProdutosFinanceiro(filtro)
  const { data: topServicos } = useTopServicosFinanceiro(filtro)
  const { data: resumoEstoque } = useResumoEstoqueFinanceiro()

  const hoje = new Date()
  const { data: meta } = useMetaDoMes(hoje.getFullYear(), hoje.getMonth() + 1)
  const definirMeta = useDefinirMetaDoMes()
  const [editandoMeta, setEditandoMeta] = useState(false)
  const [valorMetaInput, setValorMetaInput] = useState('')

  const percentualMeta = meta && meta.valorMeta > 0 && cards ? Math.min(100, (cards.receitaMes / meta.valorMeta) * 100) : 0

  const itensTop: { nome: string; valor: number; extra?: string }[] = {
    clientes: (topClientes ?? []).map((c) => ({ nome: c.nome, valor: c.total })),
    produtos: (topProdutos ?? []).map((p) => ({ nome: p.nome, valor: p.total, extra: `${p.quantidade}x` })),
    servicos: (topServicos ?? []).map((s) => ({ nome: s.nome, valor: s.total, extra: `${s.quantidade}x` })),
  }[abaTop]

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Financeiro</h1>

      <FiltroFinanceiroBar filtro={filtro} onChange={setFiltro} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            <CardIndicador titulo="Receita Hoje" valor={formatCurrency(cards?.receitaHoje ?? 0)} icone={<DollarSign size={16} />} destaque="positivo" />
            <CardIndicador titulo="Receita no Mês" valor={formatCurrency(cards?.receitaMes ?? 0)} icone={<TrendingUp size={16} />} destaque="positivo" />
            <CardIndicador titulo="Despesas Hoje" valor={formatCurrency(cards?.despesaHoje ?? 0)} icone={<TrendingDown size={16} />} destaque="negativo" />
            <CardIndicador titulo="Despesas no Mês" valor={formatCurrency(cards?.despesaMes ?? 0)} icone={<TrendingDown size={16} />} destaque="negativo" />
            <CardIndicador
              titulo="Lucro Líquido"
              valor={formatCurrency(cards?.lucroLiquido ?? 0)}
              icone={<Wallet size={16} />}
              destaque={(cards?.lucroLiquido ?? 0) >= 0 ? 'positivo' : 'negativo'}
            />
            <CardIndicador titulo="Lucro Bruto" valor={formatCurrency(cards?.lucroBruto ?? 0)} icone={<Wallet size={16} />} />
            <CardIndicador titulo="Ticket Médio" valor={formatCurrency(cards?.ticketMedio ?? 0)} icone={<Receipt size={16} />} />
            <CardIndicador titulo="Ordens Recebidas" valor={String(cards?.ordensRecebidas ?? 0)} icone={<ShoppingCart size={16} />} />
            <CardIndicador titulo="PDVs Recebidos" valor={String(cards?.pdvsRecebidos ?? 0)} icone={<Store size={16} />} />
            <CardIndicador
              titulo="Pendências"
              valor={String(cards?.pendenciasQuantidade ?? 0)}
              icone={<AlertCircle size={16} />}
              subtitulo={formatCurrency(cards?.pendenciasValor ?? 0)}
              destaque={cards && cards.pendenciasQuantidade > 0 ? 'negativo' : 'neutro'}
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <CardGrafico titulo="Receitas x Despesas">
              <GraficoReceitaDespesa dados={serieDiaria ?? []} isLoading={carregandoSerie} />
            </CardGrafico>

            <CardGrafico titulo="Receita por Forma de Pagamento">
              <GraficoPorFormaPagamento dados={porForma ?? []} isLoading={carregandoForma} />
            </CardGrafico>

            <CardGrafico titulo="Receita por Categoria">
              <GraficoPorCategoria dados={porCategoria ?? []} isLoading={carregandoCategoria} />
            </CardGrafico>

            <CardGrafico
              titulo="Receita por Responsável"
              acao={
                <SegmentedControl
                  opcoes={[
                    { valor: 'vendedor', rotulo: 'Vendedor' },
                    { valor: 'mecanico', rotulo: 'Mecânico' },
                  ]}
                  selecionado={modoResponsavel}
                  onSelecionar={setModoResponsavel}
                />
              }
            >
              <GraficoPorResponsavel dados={porResponsavel ?? []} isLoading={carregandoResponsavel} cor={modoResponsavel === 'mecanico' ? '#8b5cf6' : '#f59e0b'} />
            </CardGrafico>

            <CardGrafico
              titulo={modoSerie === 'lucro' ? 'Lucro Mensal (12 meses)' : 'Receitas dos Últimos 12 Meses'}
              acao={
                <SegmentedControl
                  opcoes={[
                    { valor: 'lucro', rotulo: 'Lucro' },
                    { valor: 'receita', rotulo: 'Receita' },
                  ]}
                  selecionado={modoSerie}
                  onSelecionar={setModoSerie}
                />
              }
            >
              {modoSerie === 'lucro' ? (
                <GraficoLucroMensal dados={serieMensal ?? []} isLoading={carregandoMensal} />
              ) : (
                <GraficoReceitasAnuais dados={serieMensal ?? []} isLoading={carregandoMensal} />
              )}
            </CardGrafico>
          </div>

          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-sm">Destaques do período</h2>
              <SegmentedControl
                opcoes={[
                  { valor: 'clientes', rotulo: 'Clientes' },
                  { valor: 'produtos', rotulo: 'Produtos' },
                  { valor: 'servicos', rotulo: 'Serviços' },
                ]}
                selecionado={abaTop}
                onSelecionar={setAbaTop}
              />
            </div>
            {itensTop.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sem dados no período.</p>
            ) : (
              <ol className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                {itensTop.map((item, indice) => (
                  <li key={indice} className="flex items-center justify-between gap-2">
                    <span className="truncate">
                      {indice + 1}. {item.nome}
                      {item.extra && <span className="text-muted-foreground"> ({item.extra})</span>}
                    </span>
                    <span className="font-medium shrink-0">{formatCurrency(item.valor)}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <AlertasFinanceiros />

          <div className="rounded-lg border p-4 space-y-2">
            <h2 className="font-medium text-sm flex items-center gap-2">
              <Target size={15} /> Meta do Mês
            </h2>
            {editandoMeta ? (
              <div className="space-y-2">
                <CampoMoeda
                  value={valorMetaInput}
                  onChange={setValorMetaInput}
                  className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      definirMeta.mutate(
                        { ano: hoje.getFullYear(), mes: hoje.getMonth() + 1, valorMeta: Number(valorMetaInput) || 0 },
                        { onSuccess: () => setEditandoMeta(false) },
                      )
                    }}
                    className="flex-1 h-8 rounded-md bg-primary text-primary-foreground text-xs font-medium"
                  >
                    Salvar
                  </button>
                  <button type="button" onClick={() => setEditandoMeta(false)} className="flex-1 h-8 rounded-md border text-xs font-medium">
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-lg font-semibold">
                  {formatCurrency(cards?.receitaMes ?? 0)}
                  <span className="text-sm font-normal text-muted-foreground"> de {formatCurrency(meta?.valorMeta ?? 0)}</span>
                </p>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${percentualMeta}%` }} />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{percentualMeta.toFixed(0)}% atingido</p>
                  <button
                    type="button"
                    onClick={() => {
                      setValorMetaInput(meta?.valorMeta ? String(meta.valorMeta) : '')
                      setEditandoMeta(true)
                    }}
                    className="text-xs text-primary underline"
                  >
                    Definir meta
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-lg border p-4 space-y-2">
            <h2 className="font-medium text-sm">Estoque</h2>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor de Custo</span>
                <span>{formatCurrency(resumoEstoque?.valorCusto ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor de Venda</span>
                <span>{formatCurrency(resumoEstoque?.valorVenda ?? 0)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Lucro Potencial</span>
                <span>{formatCurrency(resumoEstoque?.lucroPotencial ?? 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CardGrafico({ titulo, acao, children }: { titulo: string; acao?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-4 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-medium text-sm">{titulo}</h2>
        {acao}
      </div>
      {children}
    </div>
  )
}

function SegmentedControl<T extends string>({
  opcoes,
  selecionado,
  onSelecionar,
}: {
  opcoes: { valor: T; rotulo: string }[]
  selecionado: T
  onSelecionar: (valor: T) => void
}) {
  return (
    <div className="flex rounded-md border p-0.5 text-xs">
      {opcoes.map((opcao) => (
        <button
          key={opcao.valor}
          type="button"
          onClick={() => onSelecionar(opcao.valor)}
          className={`px-2 py-1 rounded ${selecionado === opcao.valor ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
        >
          {opcao.rotulo}
        </button>
      ))}
    </div>
  )
}
