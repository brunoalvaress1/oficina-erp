import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { usePermissions } from '@/hooks/usePermissions'
import { buscarPermissoesDoFuncionario, definirPermissoesFuncionario } from '../services/funcionarioService'

export function usePermissoesDoFuncionario(funcionarioId: string | undefined) {
  return useQuery({
    queryKey: ['funcionario-permissoes', funcionarioId],
    queryFn: () => buscarPermissoesDoFuncionario(funcionarioId!),
    enabled: !!funcionarioId,
  })
}

export function useDefinirPermissoes() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()

  return useMutation({
    mutationFn: ({ funcionarioId, codigos }: { funcionarioId: string; codigos: string[] }) =>
      definirPermissoesFuncionario(funcionarioId, codigos, funcionario!.id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['funcionario-permissoes', variables.funcionarioId] })
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] })
      queryClient.invalidateQueries({ queryKey: ['funcionario-historico', variables.funcionarioId] })
      toast.success('Permissões atualizadas')
    },
    onError: (error: Error) => toast.error('Erro ao atualizar permissões', { description: error.message }),
  })
}
