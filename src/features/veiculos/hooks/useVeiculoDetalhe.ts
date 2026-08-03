import { useQuery } from '@tanstack/react-query'
import { buscarVeiculoPorId } from '../services/veiculoService'

export function useVeiculoDetalhe(veiculoId: string | undefined) {
  return useQuery({
    queryKey: ['veiculo-detalhe', veiculoId],
    queryFn: () => buscarVeiculoPorId(veiculoId!),
    enabled: !!veiculoId,
    staleTime: 1000 * 30,
  })
}
