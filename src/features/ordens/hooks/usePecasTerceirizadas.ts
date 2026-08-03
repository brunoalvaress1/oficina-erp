import { useQuery } from '@tanstack/react-query'
import { buscarPecasTerceirizadas } from '../services/pecaTerceirizadaService'

export function usePecasTerceirizadasBusca(termo: string) {
  return useQuery({
    queryKey: ['pecas-terceirizadas-busca', termo],
    queryFn: () => buscarPecasTerceirizadas(termo),
    staleTime: 1000 * 10,
  })
}
