import { useQuery } from '@tanstack/react-query'
import { buscarVeiculoPorPlaca } from '../services/veiculoService'

export function useVeiculoPorPlaca(placa: string) {
  return useQuery({
    queryKey: ['veiculo-por-placa', placa],
    queryFn: () => buscarVeiculoPorPlaca(placa),
    enabled: placa.replace(/[^A-Za-z0-9]/g, '').length >= 7,
  })
}
