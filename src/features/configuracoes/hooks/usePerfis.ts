import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { usePermissions } from '@/hooks/usePermissions'
import { useRealtimeInvalidacao } from '@/hooks/useRealtimeInvalidacao'
import { atualizarPerfil, criarPerfil, excluirPerfil, listarPerfis } from '../services/perfilService'
import type { PerfilPermissaoInput } from '../types/permissaoPerfil'

export function usePerfis() {
  const { funcionario } = usePermissions()
  const query = useQuery({
    queryKey: ['perfis-permissao', funcionario?.oficinaId],
    queryFn: () => listarPerfis(funcionario!.oficinaId),
    enabled: !!funcionario?.oficinaId,
  })
  useRealtimeInvalidacao('perfis_permissao', [['perfis-permissao']])
  return query
}

export function useCriarPerfil() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()
  return useMutation({
    mutationFn: (input: PerfilPermissaoInput) => criarPerfil(input, funcionario!.oficinaId, funcionario!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['perfis-permissao'] })
      toast.success('Perfil criado')
    },
    onError: (error: Error) => toast.error('Erro ao criar perfil', { description: error.message }),
  })
}

export function useAtualizarPerfil() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PerfilPermissaoInput }) => atualizarPerfil(id, input, funcionario!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['perfis-permissao'] })
      toast.success('Perfil atualizado')
    },
    onError: (error: Error) => toast.error('Erro ao atualizar perfil', { description: error.message }),
  })
}

export function useExcluirPerfil() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()
  return useMutation({
    mutationFn: (id: string) => excluirPerfil(id, funcionario!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['perfis-permissao'] })
      toast.success('Perfil excluído')
    },
    onError: (error: Error) => toast.error('Erro ao excluir perfil', { description: error.message }),
  })
}
