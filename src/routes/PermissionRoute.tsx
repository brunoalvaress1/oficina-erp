import type { ReactNode } from 'react'
import { ShieldAlert } from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'

interface PermissionRouteProps {
  codigo: string
  children: ReactNode
}

// Diferente do `PermissionGate` (que só esconde um botão dentro de uma tela),
// esse bloqueia a tela inteira — usado direto nas rotas em `AppRoutes.tsx` pra
// que a seção fique de fato inacessível sem a permissão, mesmo digitando a URL.
export function PermissionRoute({ codigo, children }: PermissionRouteProps) {
  const { hasPermission, isLoading } = usePermissions()

  if (isLoading) return null

  if (!hasPermission(codigo)) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <ShieldAlert size={32} className="text-muted-foreground" />
        <div>
          <p className="font-medium">Você não tem permissão para acessar esta página</p>
          <p className="text-sm text-muted-foreground">Fale com um administrador se acha que deveria ter acesso.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
