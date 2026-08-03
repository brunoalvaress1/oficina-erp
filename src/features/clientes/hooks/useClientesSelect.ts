import { useQuery } from '@tanstack/react-query'
import { listarClientesSelect } from '../services/clienteService'

export function useClientesSelect() {
  return useQuery({
    queryKey: ['clientes-select'],
    queryFn: listarClientesSelect,
    staleTime: 1000 * 60 * 5,
  })
}