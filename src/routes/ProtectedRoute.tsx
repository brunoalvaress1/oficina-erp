import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import { supabase } from '@/lib/supabase'
import { useSouSuperAdmin } from '@/features/superAdmin/hooks/useSuperAdmin'

interface ProtectedRouteProps {
  children: ReactNode
  // true quando protegendo a própria área /admin — evita o redirecionamento
  // "super admin sem oficina vai pro /admin" virar um loop nela mesma.
  admin?: boolean
}

// A RLS de `oficinas` deixa o funcionário ver a própria oficina mesmo
// bloqueada (só o resto do sistema fica trancado) — é assim que dá pra
// mostrar essa tela de aviso em vez de uma tela vazia/quebrada.
function useStatusOficina(habilitado: boolean) {
  const query = useQuery({
    queryKey: ['status-oficina-bloqueio'],
    queryFn: async () => {
      const { data } = await supabase.from('oficinas').select('nome_fantasia, status_assinatura, bloqueada_motivo').maybeSingle()
      return data
    },
    enabled: habilitado,
  })
  // isLoading do React Query fica falso no instante em que `habilitado` acabou
  // de virar true mas o fetch ainda não disparou (data ainda undefined) — isso
  // deixava esse guard "vazar" pra tela real com dados incompletos por um
  // frame logo após o F5. isPending cobre isso (não depende de já estar buscando).
  return { ...query, isLoading: habilitado && query.isPending }
}

export function ProtectedRoute({ children, admin }: ProtectedRouteProps) {
  const { session, loading } = useAuth()
  const { data: oficina, isLoading: carregandoOficina } = useStatusOficina(!!session)
  const { data: souSuperAdmin, isLoading: carregandoSuperAdmin } = useSouSuperAdmin()

  if (loading || (session && carregandoOficina) || (session && !admin && carregandoSuperAdmin)) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        Carregando...
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  // Dono do sistema (sem funcionário/oficina vinculado) não tem o que fazer
  // nas telas de operação de uma oficina — manda direto pro painel dele.
  if (!admin && souSuperAdmin && !oficina) {
    return <Navigate to="/admin" replace />
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