import { useQuery } from '@tanstack/react-query'
import { buscarClientes } from '../services/clienteService'

export type ClienteBusca = Awaited<ReturnType<typeof buscarClientes>>[number]

// Sem gate de tamanho mínimo (ao contrário de useClienteSearch) — o combobox
// já mostra os primeiros clientes (por nome) assim que abre, antes de digitar
// qualquer coisa, em vez de ficar vazio esperando 2 caracteres.
export function useClientesBusca(termo: string) {
  return useQuery({
    queryKey: ['clientes-busca', termo],
    queryFn: () => buscarClientes(termo),
    staleTime: 1000 * 10,
  })
}
