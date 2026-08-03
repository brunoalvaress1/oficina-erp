import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { usePermissions } from '@/hooks/usePermissions'
import { useRealtimeInvalidacao } from '@/hooks/useRealtimeInvalidacao'
import { atualizarServico, criarServico, listarServicosCompleto } from '@/features/ordens/services/servicoService'
import type { ServicoInput } from '@/features/ordens/types/servico'

export function useServicosConfig() {
  const { funcionario } = usePermissions()
  const query = useQuery({
    queryKey: ['servicos-completo', funcionario?.oficinaId],
    queryFn: () => listarServicosCompleto(funcionario!.oficinaId),
    enabled: !!funcionario?.oficinaId,
  })
  useRealtimeInvalidacao('servicos', [['servicos-completo']])
  return query
}

export function useCriarServicoConfig() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()
  return useMutation({
    mutationFn: (input: ServicoInput) => criarServico(input, funcionario!.oficinaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos-completo'] })
      toast.success('Serviço criado')
    },
    onError: (error: Error) => toast.error('Erro ao criar serviço', { description: error.message }),
  })
}

export function useAtualizarServicoConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ServicoInput> }) => atualizarServico(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos-completo'] })
      toast.success('Serviço atualizado')
    },
    onError: (error: Error) => toast.error('Erro ao atualizar serviço', { description: error.message }),
  })
}
