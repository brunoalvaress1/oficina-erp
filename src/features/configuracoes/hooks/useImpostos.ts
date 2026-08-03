import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { usePermissions } from '@/hooks/usePermissions'
import { useRealtimeInvalidacao } from '@/hooks/useRealtimeInvalidacao'
import { atualizarImposto, criarImposto, excluirImposto, listarImpostos } from '../services/impostoService'
import type { ImpostoInput } from '../types/catalogos'

export function useImpostos() {
  const { funcionario } = usePermissions()
  const query = useQuery({
    queryKey: ['impostos', funcionario?.oficinaId],
    queryFn: () => listarImpostos(funcionario!.oficinaId),
    enabled: !!funcionario?.oficinaId,
  })
  useRealtimeInvalidacao('impostos', [['impostos']])
  return query
}

export function useCriarImposto() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()
  return useMutation({
    mutationFn: (input: ImpostoInput) => criarImposto(input, funcionario!.oficinaId, funcionario!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['impostos'] })
      toast.success('Imposto criado')
    },
    onError: (error: Error) => toast.error('Erro ao criar', { description: error.message }),
  })
}

export function useAtualizarImposto() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ImpostoInput> }) => atualizarImposto(id, input, funcionario!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['impostos'] })
      toast.success('Imposto atualizado')
    },
    onError: (error: Error) => toast.error('Erro ao atualizar', { description: error.message }),
  })
}

export function useExcluirImposto() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()
  return useMutation({
    mutationFn: (id: string) => excluirImposto(id, funcionario!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['impostos'] })
      toast.success('Imposto excluído')
    },
    onError: (error: Error) => toast.error('Erro ao excluir', { description: error.message }),
  })
}
