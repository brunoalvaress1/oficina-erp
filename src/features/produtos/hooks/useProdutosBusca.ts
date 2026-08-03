import { useQuery } from '@tanstack/react-query'
import { buscarProdutosParaEstoque } from '../services/produtoService'

export function useProdutosBusca(termo: string) {
  return useQuery({
    queryKey: ['produtos-busca', termo],
    queryFn: () => buscarProdutosParaEstoque(termo),
    staleTime: 1000 * 10,
  })
}
