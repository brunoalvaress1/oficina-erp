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

  // isLoading do React Query (isPending && isFetching) fica falso durante o
  // instante em que uma query encadeada acabou de ficar "enabled" mas o
  // fetch ainda não disparou — nessa janela isLoading=false e data=undefined
  // ao mesmo tempo, o que fazia telas com PermissionRoute/PermissionGate
  // lerem "ainda não sei" como "não tem permissão" logo após dar F5. isPending
  // cobre esse caso (é true sempre que não há dado, independente de estar
  // buscando ou não).
  const isLoading =
    (!!user && funcionarioQuery.isPending) || (!!funcionarioQuery.data?.id && permissoesQuery.isPending)

  return {
    funcionario: funcionarioQuery.data,
    permissoes: permissoesQuery.data ?? [],
    hasPermission,
    isLoading,
  }
}