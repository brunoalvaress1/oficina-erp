import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { usePermissions } from '@/hooks/usePermissions'
import {
  atualizarConfiguracaoImpressao,
  atualizarConfiguracaoNumeracao,
  buscarConfiguracaoImpressao,
  buscarConfiguracaoNumeracao,
} from '../services/impressaoNumeracaoService'
import type { ConfiguracaoImpressao, ConfiguracaoNumeracao } from '../types/preferencias'

export function useConfiguracaoImpressao() {
  const { funcionario } = usePermissions()
  return useQuery({
    queryKey: ['configuracao-impressao', funcionario?.oficinaId],
    queryFn: () => buscarConfiguracaoImpressao(funcionario!.oficinaId),
    enabled: !!funcionario?.oficinaId,
  })
}

export function useAtualizarConfiguracaoImpressao() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()
  return useMutation({
    mutationFn: (alteracoes: Partial<Omit<ConfiguracaoImpressao, 'oficinaId'>>) =>
      atualizarConfiguracaoImpressao(funcionario!.oficinaId, alteracoes, funcionario!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracao-impressao'] })
      toast.success('Configuração de impressão salva')
    },
    onError: (error: Error) => toast.error('Erro ao salvar', { description: error.message }),
  })
}

export function useConfiguracaoNumeracao() {
  const { funcionario } = usePermissions()
  return useQuery({
    queryKey: ['configuracao-numeracao', funcionario?.oficinaId],
    queryFn: () => buscarConfiguracaoNumeracao(funcionario!.oficinaId),
    enabled: !!funcionario?.oficinaId,
  })
}

export function useAtualizarConfiguracaoNumeracao() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()
  return useMutation({
    mutationFn: (alteracoes: Partial<Omit<ConfiguracaoNumeracao, 'oficinaId'>>) =>
      atualizarConfiguracaoNumeracao(funcionario!.oficinaId, alteracoes, funcionario!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracao-numeracao'] })
      toast.success('Numeração atualizada')
    },
    onError: (error: Error) => toast.error('Erro ao salvar', { description: error.message }),
  })
}
