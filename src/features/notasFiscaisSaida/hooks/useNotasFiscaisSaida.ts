import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useRealtimeInvalidacao } from '@/hooks/useRealtimeInvalidacao'
import {
  cancelarNotaFiscal,
  consultarStatusNotaFiscal,
  emitirNfse,
  emitirNotaFiscal,
  listarHistoricoNotaFiscal,
  listarNotasFiscais,
  listarNotasFiscaisPorLancamento,
  listarOrdensPagasParaEmitir,
} from '../services/notaFiscalSaidaService'
import type { ListarNotasFiscaisParams } from '../types/notaFiscalSaida'

export function useNotasFiscaisSaida(params: ListarNotasFiscaisParams = {}) {
  const query = useQuery({
    queryKey: ['notas-fiscais-saida', params],
    queryFn: () => listarNotasFiscais(params),
  })
  useRealtimeInvalidacao('notas_fiscais_saida', [['notas-fiscais-saida'], ['notas-fiscais-por-lancamento']])
  return query
}

export function useOrdensPagasParaEmitir() {
  const query = useQuery({
    queryKey: ['ordens-pagas-para-emitir'],
    queryFn: () => listarOrdensPagasParaEmitir(),
  })
  useRealtimeInvalidacao('ordens_servico', [['ordens-pagas-para-emitir']])
  useRealtimeInvalidacao('notas_fiscais_saida', [['ordens-pagas-para-emitir']])
  return query
}

// Um lançamento pode ter até 2 notas válidas simultâneas (peça + serviço),
// por isso retorna a lista inteira — quem consome decide o que fazer com
// cada tipo.
export function useNotasFiscaisPorLancamento(caixaLancamentoId: string | undefined) {
  return useQuery({
    queryKey: ['notas-fiscais-por-lancamento', caixaLancamentoId],
    queryFn: () => listarNotasFiscaisPorLancamento(caixaLancamentoId!),
    enabled: !!caixaLancamentoId,
  })
}

export function useHistoricoNotaFiscal(notaFiscalId: string | undefined) {
  return useQuery({
    queryKey: ['nota-fiscal-historico', notaFiscalId],
    queryFn: () => listarHistoricoNotaFiscal(notaFiscalId!),
    enabled: !!notaFiscalId,
  })
}

export function useEmitirNotaFiscal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ caixaLancamentoId, tipo }: { caixaLancamentoId: string; tipo?: 'nfce' | 'nfe' }) =>
      emitirNotaFiscal(caixaLancamentoId, tipo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notas-fiscais-saida'] })
      queryClient.invalidateQueries({ queryKey: ['nota-fiscal-por-lancamento'] })
      toast.success('Nota enviada — aguardando autorização da Sefaz')
    },
    onError: (error: Error) => toast.error('Erro ao emitir nota fiscal', { description: error.message }),
  })
}

export function useEmitirNfse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (caixaLancamentoId: string) => emitirNfse(caixaLancamentoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notas-fiscais-saida'] })
      queryClient.invalidateQueries({ queryKey: ['nota-fiscal-por-lancamento'] })
      toast.success('NFS-e enviada — aguardando autorização')
    },
    onError: (error: Error) => toast.error('Erro ao emitir NFS-e', { description: error.message }),
  })
}

export function useConsultarStatusNotaFiscal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (notaFiscalId: string) => consultarStatusNotaFiscal(notaFiscalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notas-fiscais-saida'] })
      queryClient.invalidateQueries({ queryKey: ['nota-fiscal-por-lancamento'] })
      toast.success('Status atualizado')
    },
    onError: (error: Error) => toast.error('Erro ao consultar status', { description: error.message }),
  })
}

export function useCancelarNotaFiscal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ notaFiscalId, justificativa }: { notaFiscalId: string; justificativa: string }) =>
      cancelarNotaFiscal(notaFiscalId, justificativa),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notas-fiscais-saida'] })
      queryClient.invalidateQueries({ queryKey: ['nota-fiscal-por-lancamento'] })
      toast.success('Nota fiscal cancelada')
    },
    onError: (error: Error) => toast.error('Erro ao cancelar nota fiscal', { description: error.message }),
  })
}
