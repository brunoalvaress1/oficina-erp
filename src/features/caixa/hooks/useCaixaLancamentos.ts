import { useEffect, useId } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { listarCaixaLancamentos } from '../services/caixaService'
import type { ListarCaixaParams } from '../types/caixa'

export function useCaixaLancamentos(params: ListarCaixaParams = {}) {
  const queryClient = useQueryClient()
  const id = useId()

  const query = useQuery({
    queryKey: ['caixa-lancamentos', params],
    queryFn: () => listarCaixaLancamentos(params),
    staleTime: 1000 * 10,
  })

  useEffect(() => {
    // Nome do canal inclui um useId() porque esse hook pode ser chamado mais de
    // uma vez na mesma tela (ex.: uma vez por filtro) — o Supabase Realtime não
    // deixa registrar `postgres_changes` num canal que já chamou `subscribe()`,
    // então um nome fixo quebraria na segunda chamada simultânea.
    const canal = supabase
      .channel(`caixa_lancamentos_lista_realtime_${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'caixa_lancamentos' }, () => {
        queryClient.invalidateQueries({ queryKey: ['caixa-lancamentos'] })
        queryClient.invalidateQueries({ queryKey: ['caixa-dashboard'] })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'caixa_recebimentos' }, () => {
        queryClient.invalidateQueries({ queryKey: ['caixa-lancamentos'] })
        queryClient.invalidateQueries({ queryKey: ['caixa-dashboard'] })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [queryClient, id])

  return query
}
