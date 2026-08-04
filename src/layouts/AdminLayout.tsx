import { Outlet, useNavigate } from 'react-router-dom'
import { LogOut, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'

// Layout completamente separado do MainLayout (sem sidebar de oficina) — o
// painel do dono do sistema não tem nada a ver com a operação de uma oficina
// específica, então não faz sentido misturar os menus.
export function AdminLayout() {
  const { signOut, user } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <header className="h-14 border-b bg-primary/5 flex items-center justify-between px-6 shrink-0 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center size-7 rounded-md bg-primary text-primary-foreground">
            <ShieldCheck size={15} />
          </div>
          <span className="font-semibold text-sm">Painel Administrativo</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{user?.email}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1 h-8 px-3 rounded-md border bg-background text-xs font-medium hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
          >
            <LogOut size={13} /> Sair
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-6">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  )
}
