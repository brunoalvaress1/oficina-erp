import { useQuery } from '@tanstack/react-query'
import { buscarVeiculosParaOS } from '../services/veiculoService'

export function useVeiculosBusca(termo: string) {
  return useQuery({
    queryKey: ['veiculos-busca', termo],
    queryFn: () => buscarVeiculosParaOS(termo),
    staleTime: 1000 * 10,
  })
}
