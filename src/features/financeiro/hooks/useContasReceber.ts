import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { usePermissions } from '@/hooks/usePermissions'
import { useRealtimeInvalidacao } from '@/hooks/useRealtimeInvalidacao'
import { baixarContaReceber, cancelarContaReceber, criarContaReceber, listarContasReceber } from '../services/contasReceberService'
import type { BaixarContaReceberInput, CriarContaReceberInput, ListarContasReceberParams } from '../types/contaReceber'

export function useContasReceber(params: ListarContasReceberParams = {}) {
  const { funcionario } = usePermissions()

  const query = useQuery({
    queryKey: ['contas-receber', funcionario?.oficinaId, params],
    queryFn: () => listarContasReceber(funcionario!.oficinaId, params),
    enabled: !!funcionario?.oficinaId,
  })

  useRealtimeInvalidacao('contas_receber', [['contas-receber']])

  return query
}

export function useCriarContaReceber() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()

  return useMutation({
    mutationFn: (input: CriarContaReceberInput) => criarContaReceber(input, funcionario!.oficinaId, funcionario!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] })
      toast.success('Conta a receber criada')
    },
    onError: (error: Error) => toast.error('Erro ao criar conta a receber', { description: error.message }),
  })
}

export function useBaixarContaReceber() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()

  return useMutation({
    mutationFn: (input: BaixarContaReceberInput) => baixarContaReceber(input, funcionario!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] })
      queryClient.invalidateQueries({ queryKey: ['movimentacoes-financeiras'] })
      queryClient.invalidateQueries({ queryKey: ['saldos-contas'] })
      toast.success('Recebimento registrado')
    },
    onError: (error: Error) => toast.error('Erro ao registrar recebimento', { description: error.message }),
  })
}

export function useCancelarContaReceber() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()

  return useMutation({
    mutationFn: ({ contaReceberId, motivo }: { contaReceberId: string; motivo: string }) =>
      cancelarContaReceber(contaReceberId, funcionario!.id, motivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] })
      toast.success('Conta a receber cancelada')
    },
    onError: (error: Error) => toast.error('Erro ao cancelar', { description: error.message }),
  })
}
