import { useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useRealtimeInvalidacao } from '@/hooks/useRealtimeInvalidacao'
import {
  buscarDadosFiscaisCliente,
  buscarUltimasTentativasPorLancamento,
  cancelarNotaFiscal,
  consultarStatusEmLote,
  consultarStatusNotaFiscal,
  emitirNfse,
  emitirNotaFiscal,
  emitirNotasEmLote,
  listarHistoricoNotaFiscal,
  listarNotasEmProcessamento,
  listarNotasFiscais,
  listarNotasFiscaisPorLancamento,
  listarOrdensPagasParaEmitir,
  resumoNotasFiscais,
} from '../services/notaFiscalSaidaService'
import type { ListarNotasFiscaisParams, ModeloNotaFiscal } from '../types/notaFiscalSaida'

export function useNotasFiscaisSaida(params: ListarNotasFiscaisParams = {}) {
  const query = useQuery({
    queryKey: ['notas-fiscais-saida', params],
    queryFn: () => listarNotasFiscais(params),
  })
  useRealtimeInvalidacao('notas_fiscais_saida', [['notas-fiscais-saida'], ['notas-fiscais-por-lancamento']])
  return query
}

export function useResumoNotasFiscais(params: Pick<ListarNotasFiscaisParams, 'status' | 'modelo' | 'dataInicio' | 'dataFim'> = {}) {
  const query = useQuery({
    queryKey: ['notas-fiscais-saida-resumo', params],
    queryFn: () => resumoNotasFiscais(params),
  })
  useRealtimeInvalidacao('notas_fiscais_saida', [['notas-fiscais-saida-resumo']])
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

// Última tentativa de cada grupo (peça/serviço) desse lançamento, SEJA QUAL
// FOR o status — diferente de useNotasFiscaisPorLancamento (que só traz nota
// válida). Usado no modal de emissão pra detectar "isso já falhou antes" e
// avisar em vez de deixar tentar de novo sem saber por quê.
export function useUltimasTentativasPorLancamento(caixaLancamentoId: string | undefined) {
  return useQuery({
    queryKey: ['notas-fiscais-ultimas-tentativas', caixaLancamentoId],
    queryFn: () => buscarUltimasTentativasPorLancamento(caixaLancamentoId!),
    enabled: !!caixaLancamentoId,
  })
}

// Dados do cliente relevantes pra saber se dá pra emitir nota sem a Sefaz
// rejeitar por cadastro incompleto — ver validarClienteParaNota.
export function useDadosFiscaisCliente(clienteId: string | undefined) {
  return useQuery({
    queryKey: ['cliente-dados-fiscais', clienteId],
    queryFn: () => buscarDadosFiscaisCliente(clienteId!),
    enabled: !!clienteId,
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
      toast.success('Nota enviada — aguardando autorização da Sefaz')
    },
    onError: (error: Error) => toast.error('Erro ao emitir nota fiscal', { description: error.message }),
    // Roda tanto no sucesso quanto no erro — uma rejeição da Sefaz também
    // grava uma linha nova em notas_fiscais_saida (status "rejeitada"), então
    // o modal precisa saber disso pra mostrar o aviso "já tentou e falhou"
    // mesmo quando a promise deu erro (ver useUltimasTentativasPorLancamento).
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notas-fiscais-saida'] })
      queryClient.invalidateQueries({ queryKey: ['notas-fiscais-por-lancamento'] })
      queryClient.invalidateQueries({ queryKey: ['notas-fiscais-ultimas-tentativas', variables.caixaLancamentoId] })
      queryClient.invalidateQueries({ queryKey: ['ordens-pagas-para-emitir'] })
    },
  })
}

export function useEmitirNfse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (caixaLancamentoId: string) => emitirNfse(caixaLancamentoId),
    onSuccess: () => {
      toast.success('NFS-e enviada — aguardando autorização')
    },
    onError: (error: Error) => toast.error('Erro ao emitir NFS-e', { description: error.message }),
    // Ver comentário em useEmitirNotaFiscal — precisa atualizar mesmo quando
    // deu erro, porque uma rejeição também grava a tentativa no banco.
    onSettled: (_data, _error, caixaLancamentoId) => {
      queryClient.invalidateQueries({ queryKey: ['notas-fiscais-saida'] })
      queryClient.invalidateQueries({ queryKey: ['notas-fiscais-por-lancamento'] })
      queryClient.invalidateQueries({ queryKey: ['notas-fiscais-ultimas-tentativas', caixaLancamentoId] })
      queryClient.invalidateQueries({ queryKey: ['ordens-pagas-para-emitir'] })
    },
  })
}

export function useEmitirNotasEmLote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ itens, modelo }: { itens: Array<{ caixaLancamentoId: string; ordemNumero: number }>; modelo: ModeloNotaFiscal }) =>
      emitirNotasEmLote(itens, modelo),
    onSuccess: (resultados) => {
      queryClient.invalidateQueries({ queryKey: ['notas-fiscais-saida'] })
      queryClient.invalidateQueries({ queryKey: ['notas-fiscais-saida-resumo'] })
      queryClient.invalidateQueries({ queryKey: ['ordens-pagas-para-emitir'] })
      queryClient.invalidateQueries({ queryKey: ['nota-fiscal-por-lancamento'] })

      const sucesso = resultados.filter((r) => r.sucesso)
      const falhas = resultados.filter((r) => !r.sucesso)
      if (falhas.length === 0) {
        toast.success(`${sucesso.length} nota${sucesso.length === 1 ? '' : 's'} enviada${sucesso.length === 1 ? '' : 's'} com sucesso`)
      } else {
        toast.warning(`${sucesso.length} enviada(s), ${falhas.length} com erro`, {
          description: falhas.map((f) => `OS ${f.ordemNumero}: ${f.erro}`).join(' · '),
        })
      }
    },
    onError: (error: Error) => toast.error('Erro ao emitir notas em lote', { description: error.message }),
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

export function useConsultarStatusEmLote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (notaIds: string[]) => consultarStatusEmLote(notaIds),
    onSuccess: (resultados) => {
      queryClient.invalidateQueries({ queryKey: ['notas-fiscais-saida'] })
      queryClient.invalidateQueries({ queryKey: ['notas-fiscais-saida-resumo'] })
      queryClient.invalidateQueries({ queryKey: ['nota-fiscal-por-lancamento'] })

      const sucesso = resultados.filter((r) => r.sucesso)
      const falhas = resultados.filter((r) => !r.sucesso)
      if (falhas.length === 0) {
        toast.success(`Status atualizado de ${sucesso.length} nota${sucesso.length === 1 ? '' : 's'}`)
      } else {
        toast.warning(`${sucesso.length} atualizada(s), ${falhas.length} com erro na consulta`, {
          description: falhas.map((f) => f.erro).join(' · '),
        })
      }
    },
    onError: (error: Error) => toast.error('Erro ao processar notas', { description: error.message }),
  })
}

// Reconsulta sozinho, em segundo plano, o status das notas ainda
// "processando"/"pendente" desse modelo — assim que a aba abre, sem
// precisar que o usuário filtre por "Processando" e clique em "Processar
// Todas" pra descobrir se já autorizou. Roda uma vez ao montar e depois
// segue rechecando a cada 20s enquanto ainda houver alguma pendente.
// Silencioso de propósito (sem toast) — é um processo de fundo, não uma
// ação que o usuário pediu; "Processar Todas" continua ali pra forçar na
// hora, se quiser.
export function useVerificarProcessandoAutomatico(modelo: ModeloNotaFiscal) {
  const queryClient = useQueryClient()
  const emAndamento = useRef(false)

  useEffect(() => {
    let cancelado = false

    async function verificar() {
      if (emAndamento.current) return
      emAndamento.current = true
      try {
        const ids = await listarNotasEmProcessamento(modelo)
        if (cancelado || ids.length === 0) return
        await consultarStatusEmLote(ids)
        if (!cancelado) {
          queryClient.invalidateQueries({ queryKey: ['notas-fiscais-saida'] })
          queryClient.invalidateQueries({ queryKey: ['notas-fiscais-saida-resumo'] })
        }
      } catch {
        // silencioso — próxima rodada tenta de novo sozinha
      } finally {
        emAndamento.current = false
      }
    }

    verificar()
    const intervalo = setInterval(verificar, 20000)
    return () => {
      cancelado = true
      clearInterval(intervalo)
    }
  }, [modelo, queryClient])
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
