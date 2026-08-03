import { useQuery } from '@tanstack/react-query'
import { listarHistoricoFinanceiro } from '../services/auditoriaFinanceiraService'
import type { ListarHistoricoFinanceiroParams } from '../types/auditoriaFinanceira'

export function useHistoricoFinanceiro(params: ListarHistoricoFinanceiroParams = {}) {
  return useQuery({
    queryKey: ['financeiro-historico', params],
    queryFn: () => listarHistoricoFinanceiro(params),
  })
}
