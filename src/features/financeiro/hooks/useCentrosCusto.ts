import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { usePermissions } from '@/hooks/usePermissions'
import { useRealtimeInvalidacao } from '@/hooks/useRealtimeInvalidacao'
import {
  atualizarCentroCusto,
  buscarCentrosCusto,
  criarCentroCusto,
  excluirCentroCusto,
  listarCentrosCusto,
} from '../services/centroCustoService'

export function useCentrosCustoLista() {
  const query = useQuery({ queryKey: ['centros-custo'], queryFn: listarCentrosCusto })
  useRealtimeInvalidacao('centros_custo', [['centros-custo']])
  return query
}

export function useCentrosCustoBusca(termoInicial = '') {
  const [termo, setTermo] = useState(termoInicial)
  const query = useQuery({ queryKey: ['centros-custo-busca', termo], queryFn: () => buscarCentrosCusto(termo) })
  return { ...query, termo, setTermo }
}

export function useCriarCentroCusto() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()

  return useMutation({
    mutationFn: (nome: string) => criarCentroCusto(nome, funcionario!.oficinaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['centros-custo'] })
      queryClient.invalidateQueries({ queryKey: ['centros-custo-busca'] })
      toast.success('Centro de custo criado')
    },
    onError: (error: Error) => toast.error('Erro ao criar centro de custo', { description: error.message }),
  })
}

export function useAtualizarCentroCusto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, alteracoes }: { id: string; alteracoes: { nome?: string; ativo?: boolean } }) =>
      atualizarCentroCusto(id, alteracoes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['centros-custo'] })
      toast.success('Centro de custo atualizado')
    },
    onError: (error: Error) => toast.error('Erro ao atualizar centro de custo', { description: error.message }),
  })
}

export function useExcluirCentroCusto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => excluirCentroCusto(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['centros-custo'] })
      toast.success('Centro de custo excluído')
    },
    onError: (error: Error) => toast.error('Erro ao excluir centro de custo', { description: error.message }),
  })
}
