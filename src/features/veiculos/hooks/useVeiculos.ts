import { useQuery } from '@tanstack/react-query'
import { listarVeiculos } from '../services/veiculoService'
import type { CampoOrdenacaoVeiculo } from '../types/veiculo'

interface UseVeiculosParams {
  page?: number
  pageSize?: number
  search?: string
  sortBy?: CampoOrdenacaoVeiculo
  sortDirection?: 'asc' | 'desc'
}

export function useVeiculos({
  page = 1,
  pageSize = 20,
  search = '',
  sortBy = 'placa',
  sortDirection = 'asc',
}: UseVeiculosParams = {}) {
  return useQuery({
    queryKey: ['veiculos', page, pageSize, search, sortBy, sortDirection],
    queryFn: () =>
      listarVeiculos({
        page,
        pageSize,
        search,
        sortBy,
        sortDirection,
      }),
    staleTime: 1000 * 30,
  })
}