import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { usePermissions } from '@/hooks/usePermissions'
import { useRealtimeInvalidacao } from '@/hooks/useRealtimeInvalidacao'
import { baixarContaPagar, cancelarContaPagar, criarContaPagar, listarContasPagar } from '../services/contasPagarService'
import type { BaixarContaPagarInput, CriarContaPagarInput, ListarContasPagarParams } from '../types/contaPagar'

export function useContasPagar(params: ListarContasPagarParams = {}) {
  const { funcionario } = usePermissions()

  const query = useQuery({
    queryKey: ['contas-pagar', funcionario?.oficinaId, params],
    queryFn: () => listarContasPagar(funcionario!.oficinaId, params),
    enabled: !!funcionario?.oficinaId,
  })

  useRealtimeInvalidacao('contas_pagar', [['contas-pagar']])

  return query
}

export function useCriarContaPagar() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()

  return useMutation({
    mutationFn: (input: CriarContaPagarInput) => criarContaPagar(input, funcionario!.oficinaId, funcionario!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] })
      toast.success('Conta a pagar criada')
    },
    onError: (error: Error) => toast.error('Erro ao criar conta a pagar', { description: error.message }),
  })
}

export function useBaixarContaPagar() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()

  return useMutation({
    mutationFn: (input: BaixarContaPagarInput) => baixarContaPagar(input, funcionario!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] })
      queryClient.invalidateQueries({ queryKey: ['movimentacoes-financeiras'] })
      queryClient.invalidateQueries({ queryKey: ['saldos-contas'] })
      toast.success('Pagamento registrado')
    },
    onError: (error: Error) => toast.error('Erro ao registrar pagamento', { description: error.message }),
  })
}

export function useCancelarContaPagar() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()

  return useMutation({
    mutationFn: ({ contaPagarId, motivo }: { contaPagarId: string; motivo: string }) =>
      cancelarContaPagar(contaPagarId, funcionario!.id, motivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] })
      toast.success('Conta a pagar cancelada')
    },
    onError: (error: Error) => toast.error('Erro ao cancelar', { description: error.message }),
  })
}
