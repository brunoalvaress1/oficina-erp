import { useQuery } from '@tanstack/react-query'
import { listarHistoricoConfiguracoes } from '../services/auditoriaConfigService'

export function useHistoricoConfiguracoes(entidade?: string) {
  return useQuery({
    queryKey: ['configuracoes-historico', entidade],
    queryFn: () => listarHistoricoConfiguracoes(entidade),
  })
}
