import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { buscarContasBancarias, criarContaBancaria } from '../services/contaBancariaService'
import { usePermissions } from '@/hooks/usePermissions'

export function useContasBancariasBusca(termo: string) {
  return useQuery({
    queryKey: ['contas-bancarias-busca', termo],
    queryFn: () => buscarContasBancarias(termo),
    staleTime: 1000 * 30,
  })
}

export function useCriarContaBancaria() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()

  return useMutation({
    mutationFn: (nome: string) => criarContaBancaria(nome, funcionario!.oficinaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-bancarias-busca'] })
      toast.success('Conta bancária criada')
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar conta bancária', { description: error.message })
    },
  })
}
