import { useEffect, useId } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { buscarOrdemDetalhe } from '../services/ordemServicoService'

export function useOrdemDetalhe(ordemServicoId: string | undefined) {
  const queryClient = useQueryClient()
  const id = useId()

  const query = useQuery({
    queryKey: ['ordem-servico-detalhe', ordemServicoId],
    queryFn: () => buscarOrdemDetalhe(ordemServicoId!),
    enabled: !!ordemServicoId,
    staleTime: 1000 * 10,
  })

  useEffect(() => {
    if (!ordemServicoId) return

    const canal = supabase
      .channel(`ordem_servico_detalhe_${ordemServicoId}_${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ordens_servico', filter: `id=eq.${ordemServicoId}` },
        () => queryClient.invalidateQueries({ queryKey: ['ordem-servico-detalhe', ordemServicoId] }),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ordem_servico_itens', filter: `ordem_servico_id=eq.${ordemServicoId}` },
        () => queryClient.invalidateQueries({ queryKey: ['ordem-servico-detalhe', ordemServicoId] }),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [ordemServicoId, queryClient, id])

  return query
}
