import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { usePermissions } from '@/hooks/usePermissions'
import { buscarMetaDoMes, definirMetaDoMes } from '../services/metaFinanceiraService'

export function useMetaDoMes(ano: number, mes: number) {
  const { funcionario } = usePermissions()
  return useQuery({
    queryKey: ['financeiro-meta', funcionario?.oficinaId, ano, mes],
    queryFn: () => buscarMetaDoMes(funcionario!.oficinaId, ano, mes),
    enabled: !!funcionario?.oficinaId,
  })
}

export function useDefinirMetaDoMes() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()

  return useMutation({
    mutationFn: ({ ano, mes, valorMeta }: { ano: number; mes: number; valorMeta: number }) =>
      definirMetaDoMes(funcionario!.oficinaId, ano, mes, valorMeta, funcionario!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financeiro-meta'] })
      toast.success('Meta definida')
    },
    onError: (error: Error) => toast.error('Erro ao definir meta', { description: error.message }),
  })
}
