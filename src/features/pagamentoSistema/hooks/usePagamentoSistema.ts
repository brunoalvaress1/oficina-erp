import { useQuery } from '@tanstack/react-query'
import { buscarConfigPlataforma, buscarInfoPagamentoSistema } from '../services/pagamentoSistemaService'

export function usePagamentoSistema() {
  return useQuery({
    queryKey: ['pagamento-sistema'],
    queryFn: () => buscarInfoPagamentoSistema(),
  })
}

export function useConfigPlataforma() {
  return useQuery({
    queryKey: ['config-plataforma'],
    queryFn: () => buscarConfigPlataforma(),
  })
}
