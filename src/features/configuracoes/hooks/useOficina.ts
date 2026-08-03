import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { usePermissions } from '@/hooks/usePermissions'
import { atualizarDadosOficina, buscarDadosOficina, enviarLogoOficina } from '../services/oficinaService'
import type { DadosOficinaInput } from '../types/oficina'

export function useDadosOficina() {
  const { funcionario } = usePermissions()
  return useQuery({
    queryKey: ['dados-oficina', funcionario?.oficinaId],
    queryFn: () => buscarDadosOficina(funcionario!.oficinaId),
    enabled: !!funcionario?.oficinaId,
  })
}

export function useAtualizarDadosOficina() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()

  return useMutation({
    mutationFn: (input: Partial<DadosOficinaInput>) => atualizarDadosOficina(funcionario!.oficinaId, input, funcionario!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dados-oficina'] })
      toast.success('Dados da oficina atualizados')
    },
    onError: (error: Error) => toast.error('Erro ao salvar', { description: error.message }),
  })
}

export function useEnviarLogoOficina() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()

  return useMutation({
    mutationFn: (arquivo: File) => enviarLogoOficina(funcionario!.oficinaId, arquivo),
    onSuccess: async (logoUrl) => {
      await atualizarDadosOficina(funcionario!.oficinaId, { logoUrl }, funcionario!.id)
      queryClient.invalidateQueries({ queryKey: ['dados-oficina'] })
      toast.success('Logo atualizada')
    },
    onError: (error: Error) => toast.error('Erro ao enviar logo', { description: error.message }),
  })
}
