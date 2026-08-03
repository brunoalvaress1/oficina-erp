import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { usePermissions } from '@/hooks/usePermissions'
import { criarEntradaChangelog, listarChangelog } from '../services/changelogService'

export function useChangelog() {
  const { funcionario } = usePermissions()
  return useQuery({
    queryKey: ['changelog', funcionario?.oficinaId],
    queryFn: () => listarChangelog(funcionario!.oficinaId),
    enabled: !!funcionario?.oficinaId,
  })
}

export function useCriarEntradaChangelog() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()
  return useMutation({
    mutationFn: ({ versao, descricao }: { versao: string; descricao: string }) =>
      criarEntradaChangelog(funcionario!.oficinaId, versao, descricao, funcionario!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['changelog'] })
      toast.success('Novidade registrada')
    },
    onError: (error: Error) => toast.error('Erro ao registrar', { description: error.message }),
  })
}
