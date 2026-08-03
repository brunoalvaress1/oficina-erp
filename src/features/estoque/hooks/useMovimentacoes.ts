import { useQuery } from '@tanstack/react-query'
import { useRealtimeInvalidacao } from '@/hooks/useRealtimeInvalidacao'
import { listarMovimentacoes } from '../services/movimentacaoService'
import type { ListarMovimentacoesParams } from '../types/movimentacao'

export function useMovimentacoes(params: ListarMovimentacoesParams = {}) {
  const query = useQuery({
    queryKey: ['movimentacoes', params],
    queryFn: () => listarMovimentacoes(params),
    staleTime: 1000 * 15,
  })

  // Realtime: qualquer nova movimentação lançada por outro usuário (ou nesta mesma
  // sessão) invalida a lista para refletir na hora, sem precisar recarregar a página.
  useRealtimeInvalidacao('estoque_movimentacoes', [['movimentacoes']])

  return query
}
