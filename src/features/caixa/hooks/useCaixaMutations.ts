import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cancelarRecebimento, marcarPendente, receberPagamento } from '../services/caixaService'
import { usePermissions } from '@/hooks/usePermissions'
import type { FormaPagamentoInput } from '../types/caixa'

export function useReceberPagamento() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()

  return useMutation({
    mutationFn: ({ caixaLancamentoId, formas }: { caixaLancamentoId: string; formas: FormaPagamentoInput[] }) =>
      receberPagamento(caixaLancamentoId, funcionario!.id, formas),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['caixa-lancamentos'] })
      queryClient.invalidateQueries({ queryKey: ['caixa-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['caixa-lancamento-detalhe', variables.caixaLancamentoId] })
      toast.success('Pagamento recebido com sucesso')
    },
    onError: (error: Error) => {
      toast.error('Erro ao receber pagamento', { description: error.message })
    },
  })
}

export function useMarcarPendente() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()

  return useMutation({
    mutationFn: ({ caixaLancamentoId, observacoes }: { caixaLancamentoId: string; observacoes?: string }) =>
      marcarPendente(caixaLancamentoId, funcionario!.id, observacoes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caixa-lancamentos'] })
      queryClient.invalidateQueries({ queryKey: ['caixa-dashboard'] })
      toast.success('Ordem movida para Pendentes')
    },
    onError: (error: Error) => {
      toast.error('Erro ao marcar como pendente', { description: error.message })
    },
  })
}

export function useCancelarRecebimento() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()

  return useMutation({
    mutationFn: ({ caixaLancamentoId, motivo }: { caixaLancamentoId: string; motivo: string }) =>
      cancelarRecebimento(caixaLancamentoId, funcionario!.id, motivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caixa-lancamentos'] })
      queryClient.invalidateQueries({ queryKey: ['caixa-dashboard'] })
      toast.success('Recebimento cancelado — a ordem voltou para o Caixa')
    },
    onError: (error: Error) => {
      toast.error('Erro ao cancelar recebimento', { description: error.message })
    },
  })
}
