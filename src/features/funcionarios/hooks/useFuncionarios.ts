import { useQuery } from '@tanstack/react-query'
import { usePermissions } from '@/hooks/usePermissions'
import { useRealtimeInvalidacao } from '@/hooks/useRealtimeInvalidacao'
import { listarFuncionarios } from '../services/funcionarioService'
import type { ListarFuncionariosParams } from '../types/funcionario'

export function useFuncionarios(params: ListarFuncionariosParams = {}) {
  const { funcionario } = usePermissions()

  const query = useQuery({
    queryKey: ['funcionarios', funcionario?.oficinaId, params],
    queryFn: () => listarFuncionarios(funcionario!.oficinaId, params),
    enabled: !!funcionario?.oficinaId,
  })

  useRealtimeInvalidacao('funcionarios', [['funcionarios']])
  useRealtimeInvalidacao('funcionario_permissoes', [['funcionarios']])

  return query
}
