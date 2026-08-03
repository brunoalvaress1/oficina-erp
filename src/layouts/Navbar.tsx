import { Moon, Sun, Search, LogOut } from 'lucide-react'
import { useTheme } from '@/providers/ThemeProvider'
import { useAuth } from '@/providers/AuthProvider'
import { useNavigate } from 'react-router-dom'

export function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const { signOut } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  return (
    <header className="h-14 border-b flex items-center justify-between px-4 gap-4">
      <div className="flex items-center flex-1 max-w-md">
        <div className="relative w-full">
          <Search
            size={16}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Pesquisar clientes, veículos, OS..."
            className="w-full h-9 pl-8 pr-3 rounded-md border bg-muted/40 text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-md hover:bg-muted transition-colors"
          aria-label="Alternar tema"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          onClick={handleLogout}
          className="p-2 rounded-md hover:bg-muted transition-colors"
          aria-label="Sair"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}