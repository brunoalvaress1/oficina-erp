import { useQuery } from '@tanstack/react-query'
import { buscarPermissoesCatalogo } from '../services/funcionarioService'

export function usePermissoesCatalogo() {
  return useQuery({
    queryKey: ['permissoes-catalogo'],
    queryFn: buscarPermissoesCatalogo,
    staleTime: 1000 * 60 * 5,
  })
}
