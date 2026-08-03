import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { criarFornecedor, atualizarFornecedor, excluirFornecedor } from '../services/fornecedorService'
import type { FornecedorInput } from '../types/fornecedor'
import { usePermissions } from '@/hooks/usePermissions'

export function useCreateFornecedor() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()

  return useMutation({
    mutationFn: (input: FornecedorInput) => criarFornecedor(input, funcionario!.oficinaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] })
      queryClient.invalidateQueries({ queryKey: ['fornecedores-select'] })
      toast.success('Fornecedor criado com sucesso')
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar fornecedor', { description: error.message })
    },
  })
}

export function useUpdateFornecedor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: FornecedorInput }) => atualizarFornecedor(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] })
      queryClient.invalidateQueries({ queryKey: ['fornecedores-select'] })
      toast.success('Fornecedor atualizado com sucesso')
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar fornecedor', { description: error.message })
    },
  })
}

export function useDeleteFornecedor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: excluirFornecedor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] })
      queryClient.invalidateQueries({ queryKey: ['fornecedores-select'] })
      toast.success('Fornecedor excluído com sucesso')
    },
    onError: (error: Error) => {
      toast.error('Erro ao excluir fornecedor', { description: error.message })
    },
  })
}
