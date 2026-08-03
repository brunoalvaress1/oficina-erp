import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { usePermissions } from '@/hooks/usePermissions'
import { buscarPreferencias, salvarPreferencias } from '../services/preferenciaService'
import type { PreferenciaFuncionario } from '../types/preferencias'

export function usePreferencias() {
  const { funcionario } = usePermissions()
  return useQuery({
    queryKey: ['preferencias-funcionario', funcionario?.id],
    queryFn: () => buscarPreferencias(funcionario!.id),
    enabled: !!funcionario?.id,
  })
}

export function useSalvarPreferencias() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()
  return useMutation({
    mutationFn: (alteracoes: Partial<Omit<PreferenciaFuncionario, 'funcionarioId'>>) => salvarPreferencias(funcionario!.id, alteracoes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferencias-funcionario'] })
      toast.success('Preferências salvas')
    },
    onError: (error: Error) => toast.error('Erro ao salvar', { description: error.message }),
  })
}
