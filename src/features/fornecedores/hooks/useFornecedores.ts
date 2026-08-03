import { useQuery } from '@tanstack/react-query'
import { listarFornecedores } from '../services/fornecedorService'
import type { CampoOrdenacaoFornecedor } from '../types/fornecedor'

interface UseFornecedoresParams {
  page?: number
  pageSize?: number
  search?: string
  sortBy?: CampoOrdenacaoFornecedor
  sortDirection?: 'asc' | 'desc'
}

export function useFornecedores({
  page = 1,
  pageSize = 20,
  search = '',
  sortBy = 'nome',
  sortDirection = 'asc',
}: UseFornecedoresParams = {}) {
  return useQuery({
    queryKey: ['fornecedores', page, pageSize, search, sortBy, sortDirection],
    queryFn: () =>
      listarFornecedores({
        page,
        pageSize,
        search,
        sortBy,
        sortDirection,
      }),
    staleTime: 1000 * 30,
  })
}
