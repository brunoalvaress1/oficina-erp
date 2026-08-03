import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { buscarBandeirasCartao, criarBandeiraCartao } from '../services/bandeiraCartaoService'
import { usePermissions } from '@/hooks/usePermissions'

export function useBandeirasCartaoBusca(termo: string) {
  return useQuery({
    queryKey: ['bandeiras-cartao-busca', termo],
    queryFn: () => buscarBandeirasCartao(termo),
    staleTime: 1000 * 30,
  })
}

export function useCriarBandeiraCartao() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()

  return useMutation({
    mutationFn: (nome: string) => criarBandeiraCartao(nome, funcionario!.oficinaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bandeiras-cartao-busca'] })
      toast.success('Bandeira criada')
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar bandeira', { description: error.message })
    },
  })
}
