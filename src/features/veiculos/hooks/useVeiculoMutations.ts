import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { criarVeiculo, atualizarVeiculo, excluirVeiculo } from '../services/veiculoService'
import type { VeiculoInput } from '../types/veiculo'
import { usePermissions } from '@/hooks/usePermissions'

export function useCreateVeiculo() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()

  return useMutation({
    mutationFn: (input: VeiculoInput) => criarVeiculo(input, funcionario!.oficinaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['veiculos'] })
      toast.success('Veículo criado com sucesso')
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar veículo', { description: error.message })
    },
  })
}

export function useUpdateVeiculo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: VeiculoInput }) =>
      atualizarVeiculo(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['veiculos'] })
      toast.success('Veículo atualizado com sucesso')
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar veículo', { description: error.message })
    },
  })
}

export function useDeleteVeiculo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: excluirVeiculo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['veiculos'] })
      toast.success('Veículo excluído com sucesso')
    },
    onError: (error: Error) => {
      toast.error('Erro ao excluir veículo', { description: error.message })
    },
  })
}