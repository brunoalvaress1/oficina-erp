import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/providers/AuthProvider'
import {
  atualizarStatusOficinaAdmin,
  atualizarVencimentoOficinaAdmin,
  criarOficinaAdmin,
  listarOficinasAdmin,
  souSuperAdmin,
} from '../services/superAdminService'
import type { CriarOficinaInput, StatusAssinatura } from '../types/oficinaAdmin'

export function useSouSuperAdmin() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['sou-super-admin', user?.id],
    queryFn: () => souSuperAdmin(),
    enabled: !!user,
  })
}

export function useOficinasAdmin() {
  return useQuery({
    queryKey: ['oficinas-admin'],
    queryFn: () => listarOficinasAdmin(),
  })
}

export function useCriarOficinaAdmin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CriarOficinaInput) => criarOficinaAdmin(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oficinas-admin'] })
      toast.success('Oficina criada com sucesso')
    },
    onError: (error: Error) => toast.error('Erro ao criar oficina', { description: error.message }),
  })
}

export function useAtualizarStatusOficinaAdmin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ oficinaId, statusAssinatura, motivo }: { oficinaId: string; statusAssinatura: StatusAssinatura; motivo?: string }) =>
      atualizarStatusOficinaAdmin(oficinaId, statusAssinatura, motivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oficinas-admin'] })
      toast.success('Status da oficina atualizado')
    },
    onError: (error: Error) => toast.error('Erro ao atualizar status', { description: error.message }),
  })
}

export function useAtualizarVencimentoOficinaAdmin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ oficinaId, vencimentoMensalidade }: { oficinaId: string; vencimentoMensalidade: string | null }) =>
      atualizarVencimentoOficinaAdmin(oficinaId, vencimentoMensalidade),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oficinas-admin'] })
      toast.success('Vencimento atualizado')
    },
    onError: (error: Error) => toast.error('Erro ao atualizar vencimento', { description: error.message }),
  })
}
