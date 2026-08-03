import { useQuery } from '@tanstack/react-query'
import { buscarSemaforoPorOrdens } from '../services/ordemServicoService'

export function useSemaforoItens(ordemIds: string[]) {
  return useQuery({
    queryKey: ['ordens-semaforo', ordemIds],
    queryFn: () => buscarSemaforoPorOrdens(ordemIds),
    enabled: ordemIds.length > 0,
    staleTime: 1000 * 15,
  })
}
