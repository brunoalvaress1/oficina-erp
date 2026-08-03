import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { listarNotasFiscais, buscarNotaFiscalDetalhe, adicionarItemNota, removerItemNota } from '../services/notaFiscalService'
import { usePermissions } from '@/hooks/usePermissions'
import type { NotaFiscalItemInput } from '../types/notaFiscal'

interface UseNotasFiscaisParams {
  page?: number
  pageSize?: number
  search?: string
}

export function useNotasFiscais({ page = 1, pageSize = 20, search = '' }: UseNotasFiscaisParams = {}) {
  return useQuery({
    queryKey: ['notas-fiscais', page, pageSize, search],
    queryFn: () => listarNotasFiscais({ page, pageSize, search }),
    staleTime: 1000 * 30,
  })
}

export function useNotaFiscalDetalhe(notaFiscalId: string | undefined) {
  return useQuery({
    queryKey: ['nota-fiscal-detalhe', notaFiscalId],
    queryFn: () => buscarNotaFiscalDetalhe(notaFiscalId!),
    enabled: !!notaFiscalId,
  })
}

export function useAdicionarItemNota() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()

  return useMutation({
    mutationFn: ({ notaFiscalId, item }: { notaFiscalId: string; item: NotaFiscalItemInput }) =>
      adicionarItemNota(notaFiscalId, funcionario!.id, item),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['nota-fiscal-detalhe', variables.notaFiscalId] })
      queryClient.invalidateQueries({ queryKey: ['notas-fiscais'] })
      queryClient.invalidateQueries({ queryKey: ['movimentacoes'] })
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
      toast.success('Produto adicionado à nota')
    },
    onError: (error: Error) => {
      toast.error('Erro ao adicionar produto', { description: error.message })
    },
  })
}

export function useRemoverItemNota() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()

  return useMutation({
    mutationFn: ({ itemId }: { itemId: string; notaFiscalId: string }) => removerItemNota(itemId, funcionario!.id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['nota-fiscal-detalhe', variables.notaFiscalId] })
      queryClient.invalidateQueries({ queryKey: ['notas-fiscais'] })
      queryClient.invalidateQueries({ queryKey: ['movimentacoes'] })
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
      toast.success('Produto removido da nota')
    },
    onError: (error: Error) => {
      toast.error('Erro ao remover produto', { description: error.message })
    },
  })
}
