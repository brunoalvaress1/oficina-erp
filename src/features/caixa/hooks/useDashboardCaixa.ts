import { useQuery } from '@tanstack/react-query'
import { buscarDashboardCaixa } from '../services/caixaService'

export function useDashboardCaixa() {
  return useQuery({
    queryKey: ['caixa-dashboard'],
    queryFn: () => buscarDashboardCaixa(),
    staleTime: 1000 * 10,
  })
}
