import { Navigate } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import { useSouSuperAdmin } from '@/features/superAdmin/hooks/useSuperAdmin'

// "/" precisa saber pra onde mandar cada tipo de login antes de redirecionar
// — dono do sistema vai pro painel admin, funcionário de oficina vai pro
// dashboard normal.
export function RaizRedirect() {
  const { session, loading } = useAuth()
  const { data: souSuperAdmin, isLoading: carregandoSuperAdmin } = useSouSuperAdmin()

  if (loading || (session && carregandoSuperAdmin)) return null
  if (!session) return <Navigate to="/login" replace />

  return <Navigate to={souSuperAdmin ? '/admin' : '/dashboard'} replace />
}
