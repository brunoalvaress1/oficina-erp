import { useQuery } from '@tanstack/react-query'
import { buscarClientePorId } from '../services/clienteService'

export function useClienteDetalhe(clienteId: string | undefined) {
  return useQuery({
    queryKey: ['cliente-detalhe', clienteId],
    queryFn: () => buscarClientePorId(clienteId!),
    enabled: !!clienteId,
    staleTime: 1000 * 30,
  })
}
