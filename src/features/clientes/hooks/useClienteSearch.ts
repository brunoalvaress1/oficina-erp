import { useQuery } from '@tanstack/react-query'
import { buscarClientes } from '../services/clienteService'

interface UseClienteSearchProps {
  search: string
}

export function useClienteSearch({
  search,
}: UseClienteSearchProps) {
  return useQuery({
    queryKey: ['cliente-search', search],

    queryFn: () => buscarClientes(search),

    enabled: search.trim().length >= 2,

    staleTime: 1000 * 60 * 5,

    placeholderData: (previousData) => previousData,
  })
}