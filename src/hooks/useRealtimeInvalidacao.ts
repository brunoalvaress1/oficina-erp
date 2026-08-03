import { useEffect, useId } from 'react'
import { useQueryClient, type QueryKey } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// Cada chamada desse hook precisa de um nome de canal ÚNICO — o Supabase Realtime
// não deixa registrar um novo `postgres_changes` num canal que já chamou
// `subscribe()`. Se duas chamadas (do mesmo hook ou de hooks diferentes) usarem
// um nome fixo igual, a segunda quebra com "cannot add callbacks after
// subscribe()". Por isso o nome do canal sempre inclui um `useId()`, garantindo
// que cada instância do hook (mesmo repetida na mesma tela) tenha o seu próprio.
export function useRealtimeInvalidacao(tabela: string, chavesInvalidadas: QueryKey[]) {
  const queryClient = useQueryClient()
  const id = useId()

  useEffect(() => {
    const canal = supabase
      .channel(`${tabela}_realtime_${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: tabela }, () => {
        for (const chave of chavesInvalidadas) queryClient.invalidateQueries({ queryKey: chave })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [queryClient, tabela, id])
}
