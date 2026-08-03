import { useQuery } from '@tanstack/react-query'
import { listarHistoricoCaixa } from '../services/caixaService'
import type { ListarHistoricoCaixaParams } from '../types/caixa'

export function useHistoricoCaixa(params: ListarHistoricoCaixaParams = {}) {
  return useQuery({
    queryKey: ['caixa-historico', params],
    queryFn: () => listarHistoricoCaixa(params),
    staleTime: 1000 * 15,
  })
}
