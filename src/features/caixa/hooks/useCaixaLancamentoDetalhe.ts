import { useEffect, useId } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { buscarCaixaLancamentoIdPorOrdem, buscarLancamentoDetalhe } from '../services/caixaService'

export function useCaixaLancamentoIdPorOrdem(ordemServicoId: string | undefined) {
  return useQuery({
    queryKey: ['caixa-lancamento-id-por-ordem', ordemServicoId],
    queryFn: () => buscarCaixaLancamentoIdPorOrdem(ordemServicoId!),
    enabled: !!ordemServicoId,
  })
}

export function useCaixaLancamentoDetalhe(caixaLancamentoId: string | undefined) {
  const queryClient = useQueryClient()
  const id = useId()

  const query = useQuery({
    queryKey: ['caixa-lancamento-detalhe', caixaLancamentoId],
    queryFn: () => buscarLancamentoDetalhe(caixaLancamentoId!),
    enabled: !!caixaLancamentoId,
    staleTime: 1000 * 10,
  })

  useEffect(() => {
    if (!caixaLancamentoId) return

    const canal = supabase
      .channel(`caixa_lancamento_detalhe_${caixaLancamentoId}_${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'caixa_lancamentos', filter: `id=eq.${caixaLancamentoId}` },
        () => queryClient.invalidateQueries({ queryKey: ['caixa-lancamento-detalhe', caixaLancamentoId] }),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'caixa_recebimentos', filter: `caixa_lancamento_id=eq.${caixaLancamentoId}` },
        () => queryClient.invalidateQueries({ queryKey: ['caixa-lancamento-detalhe', caixaLancamentoId] }),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [caixaLancamentoId, queryClient, id])

  return query
}
