import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { usePermissions } from '@/hooks/usePermissions'
import { useRealtimeInvalidacao } from '@/hooks/useRealtimeInvalidacao'
import { atualizarIntegracao, listarIntegracoes } from '../services/integracaoService'

export function useIntegracoes() {
  const { funcionario } = usePermissions()
  const query = useQuery({
    queryKey: ['integracoes', funcionario?.oficinaId],
    queryFn: () => listarIntegracoes(funcionario!.oficinaId),
    enabled: !!funcionario?.oficinaId,
  })
  useRealtimeInvalidacao('integracoes', [['integracoes']])
  return query
}

export function useAtualizarIntegracao() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()
  return useMutation({
    mutationFn: ({
      id,
      alteracoes,
    }: {
      id: string
      alteracoes: { status?: boolean; token?: string | null; apiKey?: string | null; config?: Record<string, unknown> }
    }) => atualizarIntegracao(id, alteracoes, funcionario!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integracoes'] })
      toast.success('Integração atualizada')
    },
    onError: (error: Error) => toast.error('Erro ao atualizar', { description: error.message }),
  })
}
