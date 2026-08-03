import { useQuery } from '@tanstack/react-query'
import { usePermissions } from '@/hooks/usePermissions'
import { useRealtimeInvalidacao } from '@/hooks/useRealtimeInvalidacao'
import {
  buscarCardsDashboard,
  buscarPorCategoria,
  buscarPorFormaPagamento,
  buscarPorResponsavel,
  buscarResumoEstoque,
  buscarSerieDiaria,
  buscarSerieMensal,
  buscarTopClientes,
  buscarTopProdutos,
  buscarTopServicos,
} from '../services/dashboardFinanceiroService'
import { buscarAlertasFinanceiros } from '../services/alertasFinanceiroService'
import type { FiltroFinanceiro } from '../types/filtroFinanceiro'

export function useCardsDashboard(filtro: FiltroFinanceiro) {
  const { funcionario } = usePermissions()
  const query = useQuery({
    queryKey: ['financeiro-cards', funcionario?.oficinaId, filtro.contaBancariaId, filtro.formaPagamento, filtro.categoriaId, filtro.centroCustoId],
    queryFn: () => buscarCardsDashboard(funcionario!.oficinaId, filtro),
    enabled: !!funcionario?.oficinaId,
  })
  useRealtimeInvalidacao('movimentacoes_financeiras', [['financeiro-cards']])
  return query
}

export function useSerieDiariaFinanceiro(filtro: FiltroFinanceiro) {
  const { funcionario } = usePermissions()
  const query = useQuery({
    queryKey: ['financeiro-serie-diaria', funcionario?.oficinaId, filtro],
    queryFn: () => buscarSerieDiaria(funcionario!.oficinaId, filtro),
    enabled: !!funcionario?.oficinaId,
  })
  useRealtimeInvalidacao('movimentacoes_financeiras', [['financeiro-serie-diaria']])
  return query
}

export function usePorFormaPagamentoFinanceiro(filtro: FiltroFinanceiro) {
  const { funcionario } = usePermissions()
  return useQuery({
    queryKey: ['financeiro-por-forma', funcionario?.oficinaId, filtro],
    queryFn: () => buscarPorFormaPagamento(funcionario!.oficinaId, filtro),
    enabled: !!funcionario?.oficinaId,
  })
}

export function usePorCategoriaFinanceiro(filtro: FiltroFinanceiro) {
  const { funcionario } = usePermissions()
  return useQuery({
    queryKey: ['financeiro-por-categoria', funcionario?.oficinaId, filtro],
    queryFn: () => buscarPorCategoria(funcionario!.oficinaId, filtro),
    enabled: !!funcionario?.oficinaId,
  })
}

export function usePorResponsavelFinanceiro(filtro: FiltroFinanceiro, campo: 'mecanico' | 'vendedor') {
  const { funcionario } = usePermissions()
  return useQuery({
    queryKey: ['financeiro-por-responsavel', campo, funcionario?.oficinaId, filtro.dataInicio, filtro.dataFim],
    queryFn: () => buscarPorResponsavel(funcionario!.oficinaId, filtro, campo),
    enabled: !!funcionario?.oficinaId,
  })
}

export function useSerieMensalFinanceiro(meses = 12) {
  const { funcionario } = usePermissions()
  return useQuery({
    queryKey: ['financeiro-serie-mensal', funcionario?.oficinaId, meses],
    queryFn: () => buscarSerieMensal(funcionario!.oficinaId, meses),
    enabled: !!funcionario?.oficinaId,
  })
}

export function useTopClientesFinanceiro(filtro: FiltroFinanceiro) {
  const { funcionario } = usePermissions()
  return useQuery({
    queryKey: ['financeiro-top-clientes', funcionario?.oficinaId, filtro.dataInicio, filtro.dataFim],
    queryFn: () => buscarTopClientes(funcionario!.oficinaId, filtro),
    enabled: !!funcionario?.oficinaId,
  })
}

export function useTopProdutosFinanceiro(filtro: FiltroFinanceiro) {
  const { funcionario } = usePermissions()
  return useQuery({
    queryKey: ['financeiro-top-produtos', funcionario?.oficinaId, filtro.dataInicio, filtro.dataFim],
    queryFn: () => buscarTopProdutos(funcionario!.oficinaId, filtro),
    enabled: !!funcionario?.oficinaId,
  })
}

export function useTopServicosFinanceiro(filtro: FiltroFinanceiro) {
  const { funcionario } = usePermissions()
  return useQuery({
    queryKey: ['financeiro-top-servicos', funcionario?.oficinaId, filtro.dataInicio, filtro.dataFim],
    queryFn: () => buscarTopServicos(funcionario!.oficinaId, filtro),
    enabled: !!funcionario?.oficinaId,
  })
}

export function useResumoEstoqueFinanceiro() {
  const { funcionario } = usePermissions()
  return useQuery({
    queryKey: ['financeiro-resumo-estoque', funcionario?.oficinaId],
    queryFn: () => buscarResumoEstoque(funcionario!.oficinaId),
    enabled: !!funcionario?.oficinaId,
  })
}

export function useAlertasFinanceiro() {
  const { funcionario } = usePermissions()
  return useQuery({
    queryKey: ['financeiro-alertas', funcionario?.oficinaId],
    queryFn: () => buscarAlertasFinanceiros(funcionario!.oficinaId),
    enabled: !!funcionario?.oficinaId,
    staleTime: 1000 * 30,
  })
}
