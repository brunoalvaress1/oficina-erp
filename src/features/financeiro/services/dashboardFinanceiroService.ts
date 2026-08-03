import { supabase } from '@/lib/supabase'
import type { FiltroFinanceiro } from '../types/filtroFinanceiro'
import type {
  CardsDashboardFinanceiro,
  PontoPorCategoria,
  PontoPorFormaPagamento,
  PontoPorResponsavel,
  PontoSerieDiaria,
  PontoSerieMensal,
  ResumoEstoqueFinanceiro,
  TopCliente,
  TopProduto,
  TopServico,
} from '../types/dashboardFinanceiro'

export async function buscarCardsDashboard(oficinaId: string, filtro: FiltroFinanceiro): Promise<CardsDashboardFinanceiro> {
  const { data, error } = await supabase.rpc('financeiro_dashboard_cards', {
    p_oficina_id: oficinaId,
    p_conta_bancaria_id: filtro.contaBancariaId,
    p_forma_pagamento: filtro.formaPagamento,
    p_categoria_id: filtro.categoriaId,
    p_centro_custo_id: filtro.centroCustoId,
  })
  if (error) throw new Error(error.message)
  return {
    receitaHoje: Number(data.receitaHoje ?? 0),
    receitaMes: Number(data.receitaMes ?? 0),
    despesaHoje: Number(data.despesaHoje ?? 0),
    despesaMes: Number(data.despesaMes ?? 0),
    lucroBruto: Number(data.lucroBruto ?? 0),
    lucroLiquido: Number(data.lucroLiquido ?? 0),
    ticketMedio: Number(data.ticketMedio ?? 0),
    ordensRecebidas: Number(data.ordensRecebidas ?? 0),
    pdvsRecebidos: Number(data.pdvsRecebidos ?? 0),
    pendenciasQuantidade: Number(data.pendenciasQuantidade ?? 0),
    pendenciasValor: Number(data.pendenciasValor ?? 0),
  }
}

export async function buscarSerieDiaria(oficinaId: string, filtro: FiltroFinanceiro): Promise<PontoSerieDiaria[]> {
  const { data, error } = await supabase.rpc('financeiro_serie_diaria', {
    p_oficina_id: oficinaId,
    p_data_inicio: filtro.dataInicio,
    p_data_fim: filtro.dataFim,
    p_conta_bancaria_id: filtro.contaBancariaId,
    p_forma_pagamento: filtro.formaPagamento,
    p_categoria_id: filtro.categoriaId,
    p_centro_custo_id: filtro.centroCustoId,
  })
  if (error) throw new Error(error.message)
  return (data ?? []).map((linha: any) => ({
    data: linha.data,
    entradas: Number(linha.entradas ?? 0),
    saidas: Number(linha.saidas ?? 0),
  }))
}

export async function buscarPorFormaPagamento(oficinaId: string, filtro: FiltroFinanceiro): Promise<PontoPorFormaPagamento[]> {
  const { data, error } = await supabase.rpc('financeiro_por_forma_pagamento', {
    p_oficina_id: oficinaId,
    p_data_inicio: filtro.dataInicio,
    p_data_fim: filtro.dataFim,
    p_conta_bancaria_id: filtro.contaBancariaId,
    p_categoria_id: filtro.categoriaId,
    p_centro_custo_id: filtro.centroCustoId,
  })
  if (error) throw new Error(error.message)
  return (data ?? []).map((linha: any) => ({ formaPagamento: linha.forma_pagamento, total: Number(linha.total ?? 0) }))
}

export async function buscarPorCategoria(oficinaId: string, filtro: FiltroFinanceiro): Promise<PontoPorCategoria[]> {
  const { data, error } = await supabase.rpc('financeiro_por_categoria', {
    p_oficina_id: oficinaId,
    p_data_inicio: filtro.dataInicio,
    p_data_fim: filtro.dataFim,
    p_conta_bancaria_id: filtro.contaBancariaId,
    p_forma_pagamento: filtro.formaPagamento,
    p_centro_custo_id: filtro.centroCustoId,
  })
  if (error) throw new Error(error.message)
  return (data ?? []).map((linha: any) => ({
    categoriaId: linha.categoria_id,
    categoriaNome: linha.categoria_nome,
    total: Number(linha.total ?? 0),
  }))
}

export async function buscarPorResponsavel(
  oficinaId: string,
  filtro: FiltroFinanceiro,
  campo: 'mecanico' | 'vendedor',
): Promise<PontoPorResponsavel[]> {
  const { data, error } = await supabase.rpc('financeiro_por_responsavel', {
    p_oficina_id: oficinaId,
    p_data_inicio: filtro.dataInicio,
    p_data_fim: filtro.dataFim,
    p_campo: campo,
  })
  if (error) throw new Error(error.message)
  return (data ?? []).map((linha: any) => ({ funcionarioId: linha.funcionario_id, nome: linha.nome, total: Number(linha.total ?? 0) }))
}

export async function buscarSerieMensal(oficinaId: string, meses = 12): Promise<PontoSerieMensal[]> {
  const { data, error } = await supabase.rpc('financeiro_serie_mensal', { p_oficina_id: oficinaId, p_meses: meses })
  if (error) throw new Error(error.message)
  return (data ?? []).map((linha: any) => ({
    ano: Number(linha.ano),
    mes: Number(linha.mes),
    receita: Number(linha.receita ?? 0),
    despesa: Number(linha.despesa ?? 0),
  }))
}

export async function buscarTopClientes(oficinaId: string, filtro: FiltroFinanceiro, limite = 5): Promise<TopCliente[]> {
  const { data, error } = await supabase.rpc('financeiro_top_clientes', {
    p_oficina_id: oficinaId,
    p_data_inicio: filtro.dataInicio,
    p_data_fim: filtro.dataFim,
    p_limite: limite,
  })
  if (error) throw new Error(error.message)
  return (data ?? []).map((linha: any) => ({ clienteId: linha.cliente_id, nome: linha.nome, total: Number(linha.total ?? 0) }))
}

export async function buscarTopProdutos(oficinaId: string, filtro: FiltroFinanceiro, limite = 5): Promise<TopProduto[]> {
  const { data, error } = await supabase.rpc('financeiro_top_produtos', {
    p_oficina_id: oficinaId,
    p_data_inicio: filtro.dataInicio,
    p_data_fim: filtro.dataFim,
    p_limite: limite,
  })
  if (error) throw new Error(error.message)
  return (data ?? []).map((linha: any) => ({
    produtoId: linha.produto_id,
    nome: linha.nome,
    quantidade: Number(linha.quantidade ?? 0),
    total: Number(linha.total ?? 0),
  }))
}

export async function buscarTopServicos(oficinaId: string, filtro: FiltroFinanceiro, limite = 5): Promise<TopServico[]> {
  const { data, error } = await supabase.rpc('financeiro_top_servicos', {
    p_oficina_id: oficinaId,
    p_data_inicio: filtro.dataInicio,
    p_data_fim: filtro.dataFim,
    p_limite: limite,
  })
  if (error) throw new Error(error.message)
  return (data ?? []).map((linha: any) => ({
    servicoId: linha.servico_id,
    nome: linha.nome,
    quantidade: Number(linha.quantidade ?? 0),
    total: Number(linha.total ?? 0),
  }))
}

export async function buscarResumoEstoque(oficinaId: string): Promise<ResumoEstoqueFinanceiro> {
  const { data, error } = await supabase.rpc('financeiro_resumo_estoque', { p_oficina_id: oficinaId })
  if (error) throw new Error(error.message)
  return {
    valorCusto: Number(data.valorCusto ?? 0),
    valorVenda: Number(data.valorVenda ?? 0),
    lucroPotencial: Number(data.lucroPotencial ?? 0),
  }
}
