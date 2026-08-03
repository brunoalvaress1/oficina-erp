import type { ReactNode } from 'react'
import { ShieldAlert } from 'lucide-react'
import { useSouSuperAdmin } from '@/features/superAdmin/hooks/useSuperAdmin'

interface SuperAdminRouteProps {
  children: ReactNode
}

// Painel da plataforma (gestão de oficinas) — separado do sistema de
// permissões por oficina (`PermissionRoute`), porque é um nível de acesso
// acima de qualquer oficina específica.
export function SuperAdminRoute({ children }: SuperAdminRouteProps) {
  const { data: souSuperAdmin, isLoading } = useSouSuperAdmin()

  if (isLoading) return null

  if (!souSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <ShieldAlert size={32} className="text-muted-foreground" />
        <p className="font-medium">Área restrita</p>
      </div>
    )
  }

  return <>{children}</>
}
