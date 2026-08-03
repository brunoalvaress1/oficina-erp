import { useQuery } from '@tanstack/react-query'
import { listarItensRecusados } from '../services/itensRecusadosService'
import type { ListarItensRecusadosParams } from '../services/itensRecusadosService'

export function useItensRecusados(params: ListarItensRecusadosParams = {}) {
  return useQuery({
    queryKey: ['itens-recusados', params],
    queryFn: () => listarItensRecusados(params),
    staleTime: 1000 * 15,
  })
}
