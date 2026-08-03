import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { usePermissions } from '@/hooks/usePermissions'
import { useRealtimeInvalidacao } from '@/hooks/useRealtimeInvalidacao'
import { conciliarMovimentacao, listarMovimentacoes } from '../services/movimentacoesService'
import type { ListarMovimentacoesParams } from '../types/movimentacaoFinanceira'

export function useMovimentacoes(params: ListarMovimentacoesParams = {}) {
  const { funcionario } = usePermissions()

  const query = useQuery({
    queryKey: ['movimentacoes-financeiras', funcionario?.oficinaId, params],
    queryFn: () => listarMovimentacoes(funcionario!.oficinaId, params),
    enabled: !!funcionario?.oficinaId,
    staleTime: 1000 * 10,
  })

  useRealtimeInvalidacao('movimentacoes_financeiras', [['movimentacoes-financeiras']])

  return query
}

export function useConciliarMovimentacao() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()

  return useMutation({
    mutationFn: ({ movimentacaoId, valorConciliado, motivo }: { movimentacaoId: string; valorConciliado: number; motivo?: string }) =>
      conciliarMovimentacao(movimentacaoId, funcionario!.id, valorConciliado, motivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimentacoes-financeiras'] })
      toast.success('Movimentação conciliada')
    },
    onError: (error: Error) => toast.error('Erro ao conciliar', { description: error.message }),
  })
}
