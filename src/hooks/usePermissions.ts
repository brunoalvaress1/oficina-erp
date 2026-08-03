import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/providers/AuthProvider'
import { fetchFuncionarioAtual, fetchPermissoesDoFuncionario } from '@/features/veiculos/services/permissaoService'

export function usePermissions() {
  const { user } = useAuth()

  const funcionarioQuery = useQuery({
    queryKey: ['funcionario-atual', user?.id],
    queryFn: () => fetchFuncionarioAtual(user!.id),
    enabled: !!user,
  })

  const permissoesQuery = useQuery({
    queryKey: ['permissoes', funcionarioQuery.data?.id],
    queryFn: () => fetchPermissoesDoFuncionario(funcionarioQuery.data!.id),
    enabled: !!funcionarioQuery.data?.id,
  })

  const codigos = new Set(permissoesQuery.data?.map((p) => p.codigo) ?? [])

  function hasPermission(codigo: string): boolean {
    return codigos.has(codigo)
  }

  return {
    funcionario: funcionarioQuery.data,
    permissoes: permissoesQuery.data ?? [],
    hasPermission,
    isLoading: funcionarioQuery.isLoading || permissoesQuery.isLoading,
  }
}