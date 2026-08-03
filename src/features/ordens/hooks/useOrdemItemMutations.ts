import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  adicionarItemOrdem,
  aprovarItemOrdem,
  atualizarItemOrdem,
  removerItemOrdem,
} from '../services/ordemServicoService'
import { usePermissions } from '@/hooks/usePermissions'
import type { ItemOrdemInput } from '../types/ordemServico'

export function useAdicionarItemOrdem(ordemServicoId: string) {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()

  return useMutation({
    mutationFn: (item: ItemOrdemInput) => adicionarItemOrdem(ordemServicoId, funcionario!.id, item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordem-servico-detalhe', ordemServicoId] })
      queryClient.invalidateQueries({ queryKey: ['ordens-servico'] })
    },
    onError: (error: Error) => {
      toast.error('Erro ao adicionar item', { description: error.message })
    },
  })
}

export function useAtualizarItemOrdem(ordemServicoId: string) {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()

  return useMutation({
    mutationFn: ({ itemId, alteracoes }: { itemId: string; alteracoes: Partial<ItemOrdemInput> }) =>
      atualizarItemOrdem(itemId, funcionario!.id, alteracoes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordem-servico-detalhe', ordemServicoId] })
      queryClient.invalidateQueries({ queryKey: ['ordens-servico'] })
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar item', { description: error.message })
    },
  })
}

export function useRemoverItemOrdem(ordemServicoId: string) {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()

  return useMutation({
    mutationFn: (itemId: string) => removerItemOrdem(itemId, funcionario!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordem-servico-detalhe', ordemServicoId] })
      queryClient.invalidateQueries({ queryKey: ['ordens-servico'] })
      toast.success('Item removido')
    },
    onError: (error: Error) => {
      toast.error('Erro ao remover item', { description: error.message })
    },
  })
}

export function useAprovarItemOrdem(ordemServicoId: string) {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()

  return useMutation({
    mutationFn: ({ itemId, status }: { itemId: string; status: 'aguardando' | 'aprovado' | 'recusado' }) =>
      aprovarItemOrdem(itemId, status, funcionario!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordem-servico-detalhe', ordemServicoId] })
      queryClient.invalidateQueries({ queryKey: ['ordens-servico'] })
      queryClient.invalidateQueries({ queryKey: ['itens-recusados'] })
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar aprovação do item', { description: error.message })
    },
  })
}
