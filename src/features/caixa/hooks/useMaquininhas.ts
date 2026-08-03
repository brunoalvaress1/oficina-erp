import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { buscarMaquininhas, criarMaquininha } from '../services/maquininhaService'
import { usePermissions } from '@/hooks/usePermissions'

export function useMaquininhasBusca(termo: string) {
  return useQuery({
    queryKey: ['maquininhas-busca', termo],
    queryFn: () => buscarMaquininhas(termo),
    staleTime: 1000 * 30,
  })
}

export function useCriarMaquininha() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()

  return useMutation({
    mutationFn: (nome: string) => criarMaquininha(nome, funcionario!.oficinaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maquininhas-busca'] })
      toast.success('Maquininha criada')
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar maquininha', { description: error.message })
    },
  })
}
