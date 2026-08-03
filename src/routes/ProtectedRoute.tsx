import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import { supabase } from '@/lib/supabase'

interface ProtectedRouteProps {
  children: ReactNode
}

// A RLS de `oficinas` deixa o funcionário ver a própria oficina mesmo
// bloqueada (só o resto do sistema fica trancado) — é assim que dá pra
// mostrar essa tela de aviso em vez de uma tela vazia/quebrada.
function useStatusOficina(habilitado: boolean) {
  return useQuery({
    queryKey: ['status-oficina-bloqueio'],
    queryFn: async () => {
      const { data } = await supabase.from('oficinas').select('nome_fantasia, status_assinatura, bloqueada_motivo').maybeSingle()
      return data
    },
    enabled: habilitado,
  })
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { session, loading } = useAuth()
  const { data: oficina, isLoading: carregandoOficina } = useStatusOficina(!!session)

  if (loading || (session && carregandoOficina)) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        Carregando...
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (oficina?.status_assinatura === 'bloqueada') {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <div className="max-w-sm text-center space-y-2">
          <h1 className="text-lg font-semibold">Acesso bloqueado</h1>
          <p className="text-sm text-muted-foreground">
            O acesso de <strong>{oficina.nome_fantasia}</strong> está temporariamente bloqueado
            {oficina.bloqueada_motivo ? `: ${oficina.bloqueada_motivo}` : '.'} Entre em contato pra regularizar.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}