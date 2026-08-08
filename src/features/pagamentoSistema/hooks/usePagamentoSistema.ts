import { useQuery } from '@tanstack/react-query'
import { buscarInfoPagamentoSistema } from '../services/pagamentoSistemaService'

export function usePagamentoSistema() {
  return useQuery({
    queryKey: ['pagamento-sistema'],
    queryFn: () => buscarInfoPagamentoSistema(),
  })
}
