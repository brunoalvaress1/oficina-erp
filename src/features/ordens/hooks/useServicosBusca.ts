import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { buscarServicos, criarServico } from '../services/servicoService'
import { usePermissions } from '@/hooks/usePermissions'
import type { ServicoInput } from '../types/servico'

export function useServicosBusca(termo: string) {
  return useQuery({
    queryKey: ['servicos-busca', termo],
    queryFn: () => buscarServicos(termo),
    staleTime: 1000 * 10,
  })
}

export function useCriarServico() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()

  return useMutation({
    mutationFn: (input: ServicoInput) => criarServico(input, funcionario!.oficinaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos-busca'] })
      toast.success('Serviço criado com sucesso')
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar serviço', { description: error.message })
    },
  })
}
