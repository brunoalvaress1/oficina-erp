import { useQuery } from '@tanstack/react-query'
import { buscarAnoVeiculosPorIds } from '@/features/veiculos/services/veiculoService'

export function useAnoVeiculosOrdens(veiculoIds: string[]) {
  return useQuery({
    queryKey: ['ordens-ano-veiculos', veiculoIds],
    queryFn: () => buscarAnoVeiculosPorIds(veiculoIds),
    enabled: veiculoIds.length > 0,
    staleTime: 1000 * 60,
  })
}
