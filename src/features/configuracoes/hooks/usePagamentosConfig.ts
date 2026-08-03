import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { usePermissions } from '@/hooks/usePermissions'
import {
  atualizarConfiguracaoParcelamento,
  atualizarFormaPagamentoConfig,
  buscarConfiguracaoParcelamento,
  listarFormasPagamentoConfig,
} from '../services/pagamentosService'
import type { FormaPagamentoConfigInput } from '../types/pagamentos'

export function useFormasPagamentoConfig() {
  const { funcionario } = usePermissions()
  return useQuery({
    queryKey: ['formas-pagamento-config', funcionario?.oficinaId],
    queryFn: () => listarFormasPagamentoConfig(funcionario!.oficinaId),
    enabled: !!funcionario?.oficinaId,
  })
}

export function useAtualizarFormaPagamentoConfig() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()
  return useMutation({
    mutationFn: ({ codigo, input }: { codigo: string; input: FormaPagamentoConfigInput }) =>
      atualizarFormaPagamentoConfig(codigo, input, funcionario!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formas-pagamento-config'] })
      toast.success('Forma de pagamento atualizada')
    },
    onError: (error: Error) => toast.error('Erro ao atualizar', { description: error.message }),
  })
}

export function useConfiguracaoParcelamento() {
  const { funcionario } = usePermissions()
  return useQuery({
    queryKey: ['configuracao-parcelamento', funcionario?.oficinaId],
    queryFn: () => buscarConfiguracaoParcelamento(funcionario!.oficinaId),
    enabled: !!funcionario?.oficinaId,
  })
}

export function useAtualizarConfiguracaoParcelamento() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()
  return useMutation({
    mutationFn: ({ parcelasSemJuros, jurosPercentual }: { parcelasSemJuros: number; jurosPercentual: number }) =>
      atualizarConfiguracaoParcelamento(funcionario!.oficinaId, parcelasSemJuros, jurosPercentual, funcionario!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracao-parcelamento'] })
      toast.success('Regra de parcelamento atualizada')
    },
    onError: (error: Error) => toast.error('Erro ao atualizar', { description: error.message }),
  })
}
