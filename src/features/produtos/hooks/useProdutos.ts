import { useQuery } from '@tanstack/react-query'
import { listarProdutos } from '../services/produtoService'
import type { CampoOrdenacaoProduto } from '../types/produto'

interface UseProdutosParams {
  page?: number
  pageSize?: number
  search?: string
  sortBy?: CampoOrdenacaoProduto
  sortDirection?: 'asc' | 'desc'
}

export function useProdutos({
  page = 1,
  pageSize = 20,
  search = '',
  sortBy = 'nome',
  sortDirection = 'asc',
}: UseProdutosParams = {}) {
  return useQuery({
    queryKey: ['produtos', page, pageSize, search, sortBy, sortDirection],
    queryFn: () =>
      listarProdutos({
        page,
        pageSize,
        search,
        sortBy,
        sortDirection,
      }),
    staleTime: 1000 * 30,
  })
}
