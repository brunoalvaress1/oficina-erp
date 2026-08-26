import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { usePermissions } from '@/hooks/usePermissions'
import { atualizarGrupoTaxaBandeira, listarBandeirasCartaoCompleto } from '@/features/caixa/services/bandeiraCartaoService'
import type { GrupoTaxaMaquininha } from '@/features/caixa/types/bandeiraCartao'
import {
  atualizarConfiguracaoParcelamento,
  atualizarFormaPagamentoConfig,
  buscarConfiguracaoParcelamento,
  listarFormasPagamentoConfig,
} from '../services/pagamentosService'
import { atualizarTaxaMaquininha, listarTaxasMaquininha } from '../services/taxasMaquininhaService'
import type { FormaPagamentoConfigInput } from '../types/pagamentos'

export function useFormasPagamentoConfig() {
  const { funcionario } = usePermissions()
  return useQuery({
    queryKey: ['formas-pagamento-config', funcionario?.oficinaId],
    queryFn: () => listarFormasPagamentoConfig(funcionario!.oficinaId),
    enabled: !!funcionario?.oficinaId,
  })
}

export function useAtualizarFormaPagamentoConfig() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()
  return useMutation({
    mutationFn: ({ codigo, input }: { codigo: string; input: FormaPagamentoConfigInput }) =>
      atualizarFormaPagamentoConfig(codigo, input, funcionario!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formas-pagamento-config'] })
      toast.success('Forma de pagamento atualizada')
    },
    onError: (error: Error) => toast.error('Erro ao atualizar', { description: error.message }),
  })
}

export function useConfiguracaoParcelamento() {
  const { funcionario } = usePermissions()
  return useQuery({
    queryKey: ['configuracao-parcelamento', funcionario?.oficinaId],
    queryFn: () => buscarConfiguracaoParcelamento(funcionario!.oficinaId),
    enabled: !!funcionario?.oficinaId,
  })
}

export function useAtualizarConfiguracaoParcelamento() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()
  return useMutation({
    mutationFn: ({ parcelasSemJuros, jurosPercentual }: { parcelasSemJuros: number; jurosPercentual: number }) =>
      atualizarConfiguracaoParcelamento(funcionario!.oficinaId, parcelasSemJuros, jurosPercentual, funcionario!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracao-parcelamento'] })
      toast.success('Regra de parcelamento atualizada')
    },
    onError: (error: Error) => toast.error('Erro ao atualizar', { description: error.message }),
  })
}

export function useTaxasMaquininhaConfig() {
  const { funcionario } = usePermissions()
  return useQuery({
    queryKey: ['taxas-maquininha', funcionario?.oficinaId],
    queryFn: () => listarTaxasMaquininha(funcionario!.oficinaId),
    enabled: !!funcionario?.oficinaId,
  })
}

export function useAtualizarTaxaMaquininha() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()
  return useMutation({
    mutationFn: ({ id, taxaPercentual }: { id: string; taxaPercentual: number }) =>
      atualizarTaxaMaquininha(id, taxaPercentual, funcionario!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxas-maquininha'] })
      queryClient.invalidateQueries({ queryKey: ['caixa-dashboard'] })
    },
    onError: (error: Error) => toast.error('Erro ao atualizar taxa', { description: error.message }),
  })
}

export function useBandeirasCartaoConfig() {
  const { funcionario } = usePermissions()
  return useQuery({
    queryKey: ['bandeiras-cartao-completo', funcionario?.oficinaId],
    queryFn: () => listarBandeirasCartaoCompleto(funcionario!.oficinaId),
    enabled: !!funcionario?.oficinaId,
  })
}

export function useAtualizarGrupoTaxaBandeira() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, grupoTaxa }: { id: string; grupoTaxa: GrupoTaxaMaquininha }) => atualizarGrupoTaxaBandeira(id, grupoTaxa),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bandeiras-cartao-completo'] })
      queryClient.invalidateQueries({ queryKey: ['caixa-dashboard'] })
      toast.success('Bandeira atualizada')
    },
    onError: (error: Error) => toast.error('Erro ao atualizar bandeira', { description: error.message }),
  })
}
