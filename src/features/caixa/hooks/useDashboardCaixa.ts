import { useQuery } from '@tanstack/react-query'
import { buscarDashboardCaixa } from '../services/caixaService'

export function useDashboardCaixa(dataInicio?: string, dataFim?: string) {
  return useQuery({
    queryKey: ['caixa-dashboard', dataInicio, dataFim],
    queryFn: () => buscarDashboardCaixa(dataInicio, dataFim),
    staleTime: 1000 * 10,
  })
}
