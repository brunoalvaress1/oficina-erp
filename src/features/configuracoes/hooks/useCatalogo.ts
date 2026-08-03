import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { usePermissions } from '@/hooks/usePermissions'
import { useRealtimeInvalidacao } from '@/hooks/useRealtimeInvalidacao'
import { atualizarItemCatalogo, criarItemCatalogo, excluirItemCatalogo, listarItensCatalogo } from '../services/catalogoService'
import type { TabelaCatalogo } from '../types/catalogos'

export function useCatalogo(tabela: TabelaCatalogo) {
  const { funcionario } = usePermissions()
  const query = useQuery({
    queryKey: [tabela, funcionario?.oficinaId],
    queryFn: () => listarItensCatalogo(tabela, funcionario!.oficinaId),
    enabled: !!funcionario?.oficinaId,
  })
  useRealtimeInvalidacao(tabela, [[tabela]])
  return query
}

export function useCriarItemCatalogo(tabela: TabelaCatalogo) {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()
  return useMutation({
    mutationFn: (nome: string) => criarItemCatalogo(tabela, nome, funcionario!.oficinaId, funcionario!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [tabela] })
      toast.success('Item criado')
    },
    onError: (error: Error) => toast.error('Erro ao criar', { description: error.message }),
  })
}

export function useAtualizarItemCatalogo(tabela: TabelaCatalogo) {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()
  return useMutation({
    mutationFn: ({ id, alteracoes }: { id: string; alteracoes: { nome?: string; ativo?: boolean } }) =>
      atualizarItemCatalogo(tabela, id, alteracoes, funcionario!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [tabela] })
      toast.success('Item atualizado')
    },
    onError: (error: Error) => toast.error('Erro ao atualizar', { description: error.message }),
  })
}

export function useExcluirItemCatalogo(tabela: TabelaCatalogo) {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()
  return useMutation({
    mutationFn: (id: string) => excluirItemCatalogo(tabela, id, funcionario!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [tabela] })
      toast.success('Item excluído')
    },
    onError: (error: Error) => toast.error('Erro ao excluir', { description: error.message }),
  })
}
