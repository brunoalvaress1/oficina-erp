import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { usePermissions } from '@/hooks/usePermissions'
import { useRealtimeInvalidacao } from '@/hooks/useRealtimeInvalidacao'
import {
  atualizarCategoriaFinanceira,
  buscarCategoriasFinanceiras,
  criarCategoriaFinanceira,
  excluirCategoriaFinanceira,
  listarCategoriasFinanceiras,
} from '../services/categoriaFinanceiraService'
import type { TipoCategoriaFinanceira } from '../types/categoriaFinanceira'

export function useCategoriasFinanceirasLista() {
  const query = useQuery({ queryKey: ['categorias-financeiras'], queryFn: listarCategoriasFinanceiras })
  useRealtimeInvalidacao('categorias_financeiras', [['categorias-financeiras']])
  return query
}

export function useCategoriasFinanceirasBusca(termoInicial = '') {
  const [termo, setTermo] = useState(termoInicial)
  const query = useQuery({ queryKey: ['categorias-financeiras-busca', termo], queryFn: () => buscarCategoriasFinanceiras(termo) })
  return { ...query, termo, setTermo }
}

export function useCriarCategoriaFinanceira() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()

  return useMutation({
    mutationFn: ({ nome, tipo }: { nome: string; tipo?: TipoCategoriaFinanceira }) =>
      criarCategoriaFinanceira(nome, funcionario!.oficinaId, tipo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias-financeiras'] })
      queryClient.invalidateQueries({ queryKey: ['categorias-financeiras-busca'] })
      toast.success('Categoria criada')
    },
    onError: (error: Error) => toast.error('Erro ao criar categoria', { description: error.message }),
  })
}

export function useAtualizarCategoriaFinanceira() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, alteracoes }: { id: string; alteracoes: { nome?: string; tipo?: TipoCategoriaFinanceira; ativo?: boolean } }) =>
      atualizarCategoriaFinanceira(id, alteracoes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias-financeiras'] })
      toast.success('Categoria atualizada')
    },
    onError: (error: Error) => toast.error('Erro ao atualizar categoria', { description: error.message }),
  })
}

export function useExcluirCategoriaFinanceira() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => excluirCategoriaFinanceira(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias-financeiras'] })
      toast.success('Categoria excluída')
    },
    onError: (error: Error) => toast.error('Erro ao excluir categoria', { description: error.message }),
  })
}
