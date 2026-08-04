import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { usePermissions } from '@/hooks/usePermissions'
import { useRealtimeInvalidacao } from '@/hooks/useRealtimeInvalidacao'
import { abrirCaixa, buscarResumoSessao, buscarSessaoAberta, fecharCaixa } from '../services/caixaSessaoService'

export function useSessaoCaixaAberta() {
  const { funcionario } = usePermissions()

  const query = useQuery({
    queryKey: ['caixa-sessao-aberta', funcionario?.oficinaId],
    queryFn: () => buscarSessaoAberta(funcionario!.oficinaId),
    enabled: !!funcionario?.oficinaId,
    staleTime: 1000 * 15,
  })

  useRealtimeInvalidacao('caixa_sessoes', [['caixa-sessao-aberta']])

  return query
}

export function useResumoSessaoCaixa(caixaSessaoId: string | undefined) {
  return useQuery({
    queryKey: ['caixa-resumo-sessao', caixaSessaoId],
    queryFn: () => buscarResumoSessao(caixaSessaoId!),
    enabled: !!caixaSessaoId,
    staleTime: 1000 * 5,
  })
}

export function useAbrirCaixa() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()

  return useMutation({
    mutationFn: ({ valorAbertura, observacoes }: { valorAbertura: number; observacoes?: string }) =>
      abrirCaixa(funcionario!.oficinaId, funcionario!.id, valorAbertura, observacoes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caixa-sessao-aberta'] })
      toast.success('Caixa aberto com sucesso')
    },
    onError: (error: Error) => {
      toast.error('Erro ao abrir caixa', { description: error.message })
    },
  })
}

export function useFecharCaixa() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()

  return useMutation({
    mutationFn: ({ caixaSessaoId, observacoes }: { caixaSessaoId: string; observacoes?: string }) =>
      fecharCaixa(caixaSessaoId, funcionario!.id, observacoes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caixa-sessao-aberta'] })
      toast.success('Caixa fechado com sucesso')
    },
    onError: (error: Error) => {
      toast.error('Erro ao fechar caixa', { description: error.message })
    },
  })
}
