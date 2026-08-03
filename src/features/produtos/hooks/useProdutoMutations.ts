import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { criarProduto, atualizarProduto, excluirProduto } from '../services/produtoService'
import type { ProdutoInput } from '../types/produto'
import { usePermissions } from '@/hooks/usePermissions'

export function useCreateProduto() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()

  return useMutation({
    mutationFn: (input: ProdutoInput) => criarProduto(input, funcionario!.oficinaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
      toast.success('Produto criado com sucesso')
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar produto', { description: error.message })
    },
  })
}

export function useUpdateProduto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ProdutoInput }) => atualizarProduto(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
      toast.success('Produto atualizado com sucesso')
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar produto', { description: error.message })
    },
  })
}

export function useDeleteProduto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: excluirProduto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
      toast.success('Produto excluído com sucesso')
    },
    onError: (error: Error) => {
      toast.error('Erro ao excluir produto', { description: error.message })
    },
  })
}
