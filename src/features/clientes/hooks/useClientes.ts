import { useQuery } from '@tanstack/react-query'
import { listarClientes } from '../services/clienteService'
import type { CampoOrdenacaoCliente } from '../types/cliente'

interface UseClientesParams {
  page?: number
  pageSize?: number
  search?: string
  sortBy?: CampoOrdenacaoCliente
  sortDirection?: 'asc' | 'desc'
}

export function useClientes({
  page = 1,
  pageSize = 20,
  search = '',
  sortBy = 'nome',
  sortDirection = 'asc',
}: UseClientesParams = {}) {
  return useQuery({
    queryKey: ['clientes', page, pageSize, search, sortBy, sortDirection],
    queryFn: () =>
      listarClientes({
        page,
        pageSize,
        search,
        sortBy,
        sortDirection,
      }),
    staleTime: 1000 * 30,
  })
}