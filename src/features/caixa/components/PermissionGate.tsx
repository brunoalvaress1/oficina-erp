import type { ReactNode } from 'react'
import { usePermissions } from '@/hooks/usePermissions'

interface PermissionGateProps {
  codigo: string
  children: ReactNode
  fallback?: ReactNode
}

export function PermissionGate({ codigo, children, fallback = null }: PermissionGateProps) {
  const { hasPermission, isLoading } = usePermissions()

  if (isLoading) return null
  if (!hasPermission(codigo)) return <>{fallback}</>

  return <>{children}</>
}
