import { useQuery } from '@tanstack/react-query'
import { listarHistoricoFuncionario } from '../services/funcionarioService'

export function useHistoricoFuncionario(funcionarioId: string | undefined) {
  return useQuery({
    queryKey: ['funcionario-historico', funcionarioId],
    queryFn: () => listarHistoricoFuncionario(funcionarioId!),
    enabled: !!funcionarioId,
  })
}
