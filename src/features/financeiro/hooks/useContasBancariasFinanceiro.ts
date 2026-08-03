import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { usePermissions } from '@/hooks/usePermissions'
import { useRealtimeInvalidacao } from '@/hooks/useRealtimeInvalidacao'
import {
  type ContaBancariaInput,
  criarContaBancariaCompleta,
  criarTransferencia,
  listarContasBancarias,
  listarTransferencias,
  atualizarContaBancaria,
  buscarSaldosContas,
} from '../services/contaBancariaFinanceiroService'
import type { CriarTransferenciaInput } from '../types/transferenciaBancaria'

export function useContasBancariasLista() {
  const query = useQuery({ queryKey: ['contas-bancarias-financeiro'], queryFn: listarContasBancarias })
  useRealtimeInvalidacao('contas_bancarias', [['contas-bancarias-financeiro'], ['saldos-contas']])
  return query
}

export function useSaldosContas() {
  const { funcionario } = usePermissions()
  const query = useQuery({
    queryKey: ['saldos-contas', funcionario?.oficinaId],
    queryFn: () => buscarSaldosContas(funcionario!.oficinaId),
    enabled: !!funcionario?.oficinaId,
  })
  useRealtimeInvalidacao('movimentacoes_financeiras', [['saldos-contas']])
  return query
}

export function useCriarContaBancaria() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()

  return useMutation({
    mutationFn: (input: ContaBancariaInput) => criarContaBancariaCompleta(input, funcionario!.oficinaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-bancarias-financeiro'] })
      toast.success('Conta bancária criada')
    },
    onError: (error: Error) => toast.error('Erro ao criar conta bancária', { description: error.message }),
  })
}

export function useAtualizarContaBancaria() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ContaBancariaInput }) => atualizarContaBancaria(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-bancarias-financeiro'] })
      toast.success('Conta bancária atualizada')
    },
    onError: (error: Error) => toast.error('Erro ao atualizar conta bancária', { description: error.message }),
  })
}

export function useTransferenciasLista() {
  const { funcionario } = usePermissions()
  const query = useQuery({
    queryKey: ['transferencias-bancarias', funcionario?.oficinaId],
    queryFn: () => listarTransferencias(funcionario!.oficinaId),
    enabled: !!funcionario?.oficinaId,
  })
  useRealtimeInvalidacao('transferencias_bancarias', [['transferencias-bancarias'], ['saldos-contas']])
  return query
}

export function useCriarTransferencia() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()

  return useMutation({
    mutationFn: (input: CriarTransferenciaInput) => criarTransferencia(input, funcionario!.oficinaId, funcionario!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transferencias-bancarias'] })
      queryClient.invalidateQueries({ queryKey: ['saldos-contas'] })
      toast.success('Transferência realizada')
    },
    onError: (error: Error) => toast.error('Erro ao transferir', { description: error.message }),
  })
}
