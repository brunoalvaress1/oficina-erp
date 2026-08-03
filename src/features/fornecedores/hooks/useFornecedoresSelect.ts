import { useQuery } from '@tanstack/react-query'
import { listarFornecedoresSelect } from '../services/fornecedorService'

export function useFornecedoresSelect(search = '') {
  return useQuery({
    queryKey: ['fornecedores-select', search],
    queryFn: () => listarFornecedoresSelect(search),
    staleTime: 1000 * 30,
  })
}
