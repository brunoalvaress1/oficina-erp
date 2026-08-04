import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Car,
  Package,
  Boxes,
  Truck,
  ClipboardList,
  Wallet,
  DollarSign,
  UserCog,
  BarChart3,
  Settings,
  Receipt,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Wrench,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePermissions } from '@/hooks/usePermissions'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

interface MenuItem {
  to: string
  icon: typeof LayoutDashboard
  label: string
  codigo?: string
  children?: { to: string; label: string }[]
}

const menuItems: MenuItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clientes', icon: Users, label: 'Clientes', codigo: 'clientes.visualizar' },
  { to: '/veiculos', icon: Car, label: 'Veículos', codigo: 'veiculos.visualizar' },
  { to: '/produtos', icon: Package, label: 'Produtos', codigo: 'produtos.visualizar' },
  { to: '/estoque', icon: Boxes, label: 'Estoque', codigo: 'estoque.visualizar' },
  { to: '/fornecedores', icon: Truck, label: 'Fornecedores', codigo: 'fornecedores.visualizar' },
  {
    to: '/ordens',
    icon: ClipboardList,
    label: 'Ordens de Serviço',
    codigo: 'ordens.visualizar',
    children: [
      { to: '/ordens/nova', label: 'Nova Ordem' },
      { to: '/ordens', label: 'Lista de Ordens' },
      { to: '/ordens/itens-recusados', label: 'Itens Recusados' },
    ],
  },
  {
    to: '/caixa',
    icon: Wallet,
    label: 'Caixa',
    codigo: 'caixa.visualizar',
    children: [
      { to: '/caixa', label: 'Caixa' },
      { to: '/caixa/pendentes', label: 'Pendentes' },
      { to: '/caixa/historico', label: 'Histórico' },
    ],
  },
  {
    to: '/financeiro',
    icon: DollarSign,
    label: 'Financeiro',
    codigo: 'financeiro.visualizar',
    children: [
      { to: '/financeiro', label: 'Dashboard' },
      { to: '/financeiro/contas-a-receber', label: 'Contas a Receber' },
      { to: '/financeiro/contas-a-pagar', label: 'Contas a Pagar' },
      { to: '/financeiro/fluxo-de-caixa', label: 'Fluxo de Caixa' },
      { to: '/financeiro/movimentacoes', label: 'Movimentações' },
      { to: '/financeiro/contas-bancarias', label: 'Contas Bancárias' },
      { to: '/financeiro/categorias', label: 'Categorias Financeiras' },
      { to: '/financeiro/conciliacao', label: 'Conciliação' },
      { to: '/financeiro/auditoria', label: 'Auditoria' },
    ],
  },
  { to: '/notas-fiscais', icon: Receipt, label: 'Notas Fiscais', codigo: 'notas_fiscais.visualizar' },
  { to: '/funcionarios', icon: UserCog, label: 'Funcionários', codigo: 'funcionarios.visualizar' },
  {
    to: '/relatorios',
    icon: BarChart3,
    label: 'Relatórios',
    codigo: 'relatorios.visualizar',
    children: [
      { to: '/relatorios', label: 'Visão Geral' },
      { to: '/relatorios/lucro-pecas', label: 'Lucro em Peças' },
      { to: '/relatorios/lucro-servicos', label: 'Lucro em Serviços' },
    ],
  },
  {
    to: '/configuracoes',
    icon: Settings,
    label: 'Configurações',
    codigo: 'configuracoes.visualizar',
    children: [
      { to: '/configuracoes', label: 'Visão Geral' },
      { to: '/configuracoes/dados-oficina', label: 'Dados da Oficina' },
      { to: '/configuracoes/perfis', label: 'Perfis de Permissão' },
      { to: '/configuracoes/formas-pagamento', label: 'Formas de Pagamento' },
      { to: '/configuracoes/impostos', label: 'Impostos' },
      { to: '/configuracoes/nota-fiscal', label: 'Nota Fiscal' },
      { to: '/configuracoes/whatsapp', label: 'WhatsApp' },
      { to: '/configuracoes/categorias', label: 'Categorias' },
      { to: '/configuracoes/mecanicos', label: 'Mecânicos' },
      { to: '/configuracoes/vendedores', label: 'Vendedores' },
      { to: '/configuracoes/servicos', label: 'Serviços' },
      { to: '/configuracoes/integracoes', label: 'Integrações' },
      { to: '/configuracoes/notificacoes', label: 'Notificações' },
      { to: '/configuracoes/backup', label: 'Backup' },
      { to: '/configuracoes/preferencias', label: 'Preferências' },
      { to: '/configuracoes/auditoria', label: 'Auditoria' },
      { to: '/configuracoes/seguranca', label: 'Segurança' },
      { to: '/configuracoes/atualizacoes', label: 'Atualizações' },
    ],
  },
]

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation()
  const { hasPermission, isLoading: carregandoPermissoes } = usePermissions()

  const itensVisiveis = carregandoPermissoes ? [] : menuItems.filter((item) => !item.codigo || hasPermission(item.codigo))

  const grupoAtivoInicial = itensVisiveis.find(
    (item) => item.children?.some((filho) => location.pathname === filho.to || location.pathname.startsWith(`${filho.to}/`)),
  )?.to
  const [grupoAberto, setGrupoAberto] = useState<string | null>(grupoAtivoInicial ?? null)

  return (
    <aside
      className={cn(
        'h-screen border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-200',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex items-center justify-between h-14 px-3 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center justify-center size-7 rounded-md bg-sidebar-primary text-sidebar-primary-foreground shrink-0">
              <Wrench size={15} />
            </div>
            <span className="font-semibold text-sm truncate">Oficina ERP</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors ml-auto"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {itensVisiveis.map((item) => {
          if (!item.children) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors border-l-2',
                    'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    isActive
                      ? 'border-sidebar-primary bg-sidebar-primary/10 text-sidebar-primary font-medium'
                      : 'border-transparent text-sidebar-foreground/70'
                  )
                }
              >
                <item.icon size={18} className="shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            )
          }

          const grupoEstaAberto = grupoAberto === item.to
          const algumFilhoAtivo = item.children.some(
            (filho) => location.pathname === filho.to || location.pathname.startsWith(`${filho.to}/`),
          )

          return (
            <div key={item.to}>
              <button
                type="button"
                onClick={() => setGrupoAberto(grupoEstaAberto ? null : item.to)}
                className={cn(
                  'w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors border-l-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  algumFilhoAtivo
                    ? 'border-sidebar-primary bg-sidebar-primary/10 text-sidebar-primary font-medium'
                    : 'border-transparent text-sidebar-foreground/70',
                )}
              >
                <item.icon size={18} className="shrink-0" />
                {!collapsed && (
                  <>
                    <span className="truncate flex-1 text-left">{item.label}</span>
                    <ChevronDown
                      size={14}
                      className={cn('transition-transform', grupoEstaAberto ? 'rotate-180' : '')}
                    />
                  </>
                )}
              </button>

              {!collapsed && grupoEstaAberto && (
                <div className="ml-6 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-2">
                  {item.children.map((filho) => (
                    <NavLink
                      key={filho.to}
                      to={filho.to}
                      end={filho.to === '/ordens' || filho.to === '/caixa' || filho.to === '/financeiro' || filho.to === '/relatorios' || filho.to === '/configuracoes'}
                      className={({ isActive }) =>
                        cn(
                          'block rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                          isActive ? 'bg-sidebar-primary/10 text-sidebar-primary font-medium' : 'text-sidebar-foreground/70',
                        )
                      }
                    >
                      {filho.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}