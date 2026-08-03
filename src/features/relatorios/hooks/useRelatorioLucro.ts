import { useQuery } from '@tanstack/react-query'
import { usePermissions } from '@/hooks/usePermissions'
import { buscarLucroPecas, buscarLucroServicos } from '../services/relatorioService'

export function useLucroPecas(dataInicio: string, dataFim: string) {
  const { funcionario } = usePermissions()
  return useQuery({
    queryKey: ['relatorio-lucro-pecas', funcionario?.oficinaId, dataInicio, dataFim],
    queryFn: () => buscarLucroPecas(funcionario!.oficinaId, dataInicio, dataFim),
    enabled: !!funcionario?.oficinaId,
  })
}

export function useLucroServicos(dataInicio: string, dataFim: string) {
  const { funcionario } = usePermissions()
  return useQuery({
    queryKey: ['relatorio-lucro-servicos', funcionario?.oficinaId, dataInicio, dataFim],
    queryFn: () => buscarLucroServicos(funcionario!.oficinaId, dataInicio, dataFim),
    enabled: !!funcionario?.oficinaId,
  })
}
