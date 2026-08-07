import { Link } from 'react-router-dom'
import { LayoutDashboard, ClipboardList, Wallet, Receipt } from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'
import { formatCurrency } from '@/utils/format'
import { CardIndicador } from '@/features/financeiro/components/CardIndicador'
import { AlertasFinanceiros } from '@/features/financeiro/components/AlertasFinanceiros'
import { useCardsDashboard } from '@/features/financeiro/hooks/useDashboardFinanceiro'
import { criarFiltroFinanceiroPadrao } from '@/features/financeiro/types/filtroFinanceiro'
import { DashboardCaixa } from '@/features/caixa/components/DashboardCaixa'
import { useOrdensPagasParaEmitir } from '@/features/notasFiscaisSaida/hooks/useNotasFiscaisSaida'

// Cada painel que busca dado próprio vira um componente à parte, montado só
// quando a permissão correspondente existe — assim o hook (e a consulta que
// ele dispara) nem roda pra quem não pode ver aquilo, em vez de buscar o
// dado e só esconder na tela.

function PainelFinanceiro({ podeVerLucro }: { podeVerLucro: boolean }) {
  const { data: cards } = useCardsDashboard(criarFiltroFinanceiroPadrao())
  if (!cards) return null

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <CardIndicador titulo="Receita Hoje" valor={formatCurrency(cards.receitaHoje)} destaque="positivo" />
      <CardIndicador titulo="Receita do Mês" valor={formatCurrency(cards.receitaMes)} />
      <CardIndicador
        titulo="Pendências"
        valor={formatCurrency(cards.pendenciasValor)}
        subtitulo={`${cards.pendenciasQuantidade} conta(s)`}
        destaque={cards.pendenciasQuantidade > 0 ? 'negativo' : 'neutro'}
      />
      <CardIndicador titulo="Ticket Médio" valor={formatCurrency(cards.ticketMedio)} />
      {podeVerLucro && (
        <CardIndicador
          titulo="Lucro Líquido (mês)"
          valor={formatCurrency(cards.lucroLiquido)}
          destaque={cards.lucroLiquido >= 0 ? 'positivo' : 'negativo'}
        />
      )}
    </div>
  )
}

function PainelNotasPendentes() {
  const { data: ordensPendentes } = useOrdensPagasParaEmitir()
  const quantidade = ordensPendentes?.length ?? 0
  if (quantidade === 0) return null

  return (
    <Link to="/notas-fiscais" className="flex items-center gap-2.5 rounded-lg border bg-card p-4 shadow-sm hover:bg-muted/40 transition-colors">
      <div className="flex items-center justify-center size-9 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
        <Receipt size={18} />
      </div>
      <div>
        <p className="font-medium text-sm">
          {quantidade} OS paga{quantidade === 1 ? '' : 's'} aguardando emissão de nota fiscal
        </p>
        <p className="text-xs text-muted-foreground">Clique para ver e emitir</p>
      </div>
    </Link>
  )
}

export function Dashboard() {
  const { funcionario, hasPermission } = usePermissions()
  const podeVerFinanceiro = hasPermission('financeiro.visualizar')
  const podeVerLucro = hasPermission('ordens.visualizar_lucro')
  const podeVerCaixa = hasPermission('caixa.visualizar')
  const podeVerNotas = hasPermission('notas_fiscais.visualizar')
  const podeVerOrdens = hasPermission('ordens.visualizar')

  const primeiroNome = funcionario?.nome?.split(' ')[0] ?? ''
  const dataDeHoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 text-primary shrink-0">
          <LayoutDashboard size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">{primeiroNome ? `Olá, ${primeiroNome}` : 'Olá'}</h1>
          <p className="text-sm text-muted-foreground capitalize">{dataDeHoje}</p>
        </div>
      </div>

      {(podeVerOrdens || podeVerCaixa) && (
        <div className="flex flex-wrap gap-2">
          {podeVerOrdens && (
            <Link
              to="/ordens/nova"
              className="flex items-center gap-2 h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <ClipboardList size={15} /> Nova Ordem de Serviço
            </Link>
          )}
          {podeVerCaixa && (
            <Link
              to="/caixa"
              className="flex items-center gap-2 h-10 px-4 rounded-md border bg-card text-sm font-medium hover:bg-muted transition-colors"
            >
              <Wallet size={15} /> Ir para o Caixa
            </Link>
          )}
        </div>
      )}

      {podeVerNotas && <PainelNotasPendentes />}
      {podeVerFinanceiro && <AlertasFinanceiros />}
      {podeVerFinanceiro && <PainelFinanceiro podeVerLucro={podeVerLucro} />}
      {podeVerCaixa && <DashboardCaixa />}

      {!podeVerFinanceiro && !podeVerCaixa && !podeVerNotas && !podeVerOrdens && (
        <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
          Nenhum painel disponível pro seu usuário ainda — fale com quem administra o sistema se acha que deveria ver algo aqui.
        </div>
      )}
    </div>
  )
}
