import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Wrench } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { souSuperAdmin } from '@/features/superAdmin/services/superAdminService'

export function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    const { error } = await signIn(email, password)

    setIsSubmitting(false)

    if (error) {
      toast.error('Não foi possível entrar', { description: error })
      return
    }

    toast.success('Login realizado com sucesso')
    // Login do dono do sistema vai pro painel administrativo, nunca pro
    // sistema de uma oficina específica.
    const ehSuperAdmin = await souSuperAdmin().catch(() => false)
    navigate(ehSuperAdmin ? '/admin' : '/dashboard')
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center size-12 rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Wrench size={22} />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-xl font-semibold">Oficina ERP</h1>
            <p className="text-sm text-muted-foreground">Entre com sua conta</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="w-full border rounded-xl bg-card p-6 space-y-4 shadow-sm"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-9 px-3 rounded-md border bg-transparent text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-9 px-3 rounded-md border bg-transparent text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}