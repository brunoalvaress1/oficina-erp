import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  atualizarCabecalhoOrdem,
  cancelarOrdemServico,
  criarOrdemServico,
  finalizarOrdemServico,
  reabrirOrdemServico,
} from '../services/ordemServicoService'
import { enviarWhatsappOsPronta } from '@/features/whatsapp/services/whatsappService'
import { usePermissions } from '@/hooks/usePermissions'
import type { AtualizarCabecalhoInput, CriarOrdemServicoInput } from '../types/ordemServico'

export function useCriarOrdemServico() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()

  return useMutation({
    mutationFn: (input: CriarOrdemServicoInput) =>
      criarOrdemServico(input, funcionario!.oficinaId, funcionario!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordens-servico'] })
      toast.success('Ordem de serviço criada com sucesso')
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar ordem de serviço', { description: error.message })
    },
  })
}

export function useAtualizarCabecalhoOrdem(ordemServicoId: string) {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()

  return useMutation({
    mutationFn: (alteracoes: AtualizarCabecalhoInput) =>
      atualizarCabecalhoOrdem(ordemServicoId, funcionario!.id, alteracoes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordem-servico-detalhe', ordemServicoId] })
      queryClient.invalidateQueries({ queryKey: ['ordens-servico'] })
      toast.success('Ordem de serviço atualizada')
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar ordem de serviço', { description: error.message })
    },
  })
}

export function useFinalizarOrdemServico(ordemServicoId: string) {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()

  return useMutation({
    mutationFn: () => finalizarOrdemServico(ordemServicoId, funcionario!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordem-servico-detalhe', ordemServicoId] })
      queryClient.invalidateQueries({ queryKey: ['ordens-servico'] })
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
      queryClient.invalidateQueries({ queryKey: ['movimentacoes'] })
      toast.success('Ordem finalizada e enviada ao caixa')
      // Falha no envio do WhatsApp não desfaz nem afeta a finalização — a OS
      // já está no Caixa de qualquer forma, só avisa o usuário à parte. Se a
      // integração simplesmente estiver desativada, fica em silêncio (não é
      // um erro, é uma escolha) — só avisa em falhas de verdade.
      enviarWhatsappOsPronta(ordemServicoId).catch((error: Error) => {
        if (error.message.includes('Integração de WhatsApp inativa')) return
        toast.error('Ordem finalizada, mas a mensagem de WhatsApp não foi enviada', { description: error.message })
      })
    },
    onError: (error: Error) => {
      toast.error('Erro ao finalizar ordem de serviço', { description: error.message })
    },
  })
}

export function useReabrirOrdemServico(ordemServicoId: string) {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()

  return useMutation({
    mutationFn: () => reabrirOrdemServico(ordemServicoId, funcionario!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordem-servico-detalhe', ordemServicoId] })
      queryClient.invalidateQueries({ queryKey: ['ordens-servico'] })
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
      queryClient.invalidateQueries({ queryKey: ['movimentacoes'] })
      toast.success('Ordem reaberta — voltou para Em Execução')
    },
    onError: (error: Error) => {
      toast.error('Erro ao reabrir ordem de serviço', { description: error.message })
    },
  })
}

export function useCancelarOrdemServico(ordemServicoId: string) {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()

  return useMutation({
    mutationFn: () => cancelarOrdemServico(ordemServicoId, funcionario!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordem-servico-detalhe', ordemServicoId] })
      queryClient.invalidateQueries({ queryKey: ['ordens-servico'] })
      toast.success('Ordem de serviço cancelada')
    },
    onError: (error: Error) => {
      toast.error('Erro ao cancelar ordem de serviço', { description: error.message })
    },
  })
}
