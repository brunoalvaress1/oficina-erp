import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { criarCliente, atualizarCliente, excluirCliente } from '../services/clienteService'
import type { ClienteInput } from '../types/cliente'
import { usePermissions } from '@/hooks/usePermissions'

export function useCreateCliente() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()

  return useMutation({
    mutationFn: (input: ClienteInput) => criarCliente(input, funcionario!.oficinaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      toast.success('Cliente criado com sucesso')
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar cliente', { description: error.message })
    },
  })
}

export function useUpdateCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ClienteInput }) =>
      atualizarCliente(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      toast.success('Cliente atualizado com sucesso')
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar cliente', { description: error.message })
    },
  })
}

export function useDeleteCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: excluirCliente,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      toast.success('Cliente excluído com sucesso')
    },
    onError: (error: Error) => {
      toast.error('Erro ao excluir cliente', { description: error.message })
    },
  })
}