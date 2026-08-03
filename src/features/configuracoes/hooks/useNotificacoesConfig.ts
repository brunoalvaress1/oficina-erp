import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { usePermissions } from '@/hooks/usePermissions'
import { alternarNotificacaoConfig, listarNotificacoesConfig } from '../services/notificacaoService'

export function useNotificacoesConfig() {
  const { funcionario } = usePermissions()
  return useQuery({
    queryKey: ['notificacoes-config', funcionario?.oficinaId],
    queryFn: () => listarNotificacoesConfig(funcionario!.oficinaId),
    enabled: !!funcionario?.oficinaId,
  })
}

export function useAlternarNotificacaoConfig() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()
  return useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) => alternarNotificacaoConfig(id, ativo, funcionario!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes-config'] })
      toast.success('Preferência salva')
    },
    onError: (error: Error) => toast.error('Erro ao salvar', { description: error.message }),
  })
}
