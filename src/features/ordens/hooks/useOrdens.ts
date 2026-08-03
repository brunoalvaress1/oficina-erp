import { useQuery } from '@tanstack/react-query'
import { useRealtimeInvalidacao } from '@/hooks/useRealtimeInvalidacao'
import { listarOrdens } from '../services/ordemServicoService'
import type { ListarOrdensParams } from '../types/ordemServico'

export function useOrdens(params: ListarOrdensParams = {}) {
  const query = useQuery({
    queryKey: ['ordens-servico', params],
    queryFn: () => listarOrdens(params),
    staleTime: 1000 * 15,
  })

  useRealtimeInvalidacao('ordens_servico', [['ordens-servico']])
  useRealtimeInvalidacao('ordem_servico_itens', [['ordens-servico']])

  return query
}
