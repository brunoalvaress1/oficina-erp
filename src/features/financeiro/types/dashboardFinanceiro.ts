export interface CardsDashboardFinanceiro {
  receitaHoje: number
  receitaMes: number
  despesaHoje: number
  despesaMes: number
  lucroBruto: number
  lucroLiquido: number
  ticketMedio: number
  ordensRecebidas: number
  pdvsRecebidos: number
  pendenciasQuantidade: number
  pendenciasValor: number
}

export interface PontoSerieDiaria {
  data: string
  entradas: number
  saidas: number
}

export interface PontoPorFormaPagamento {
  formaPagamento: string
  total: number
}

export interface PontoPorCategoria {
  categoriaId: string | null
  categoriaNome: string
  total: number
}

export interface PontoPorResponsavel {
  funcionarioId: string
  nome: string
  total: number
}

export interface PontoSerieMensal {
  ano: number
  mes: number
  receita: number
  despesa: number
}

export interface TopCliente {
  clienteId: string
  nome: string
  total: number
}

export interface TopProduto {
  produtoId: string | null
  nome: string
  quantidade: number
  total: number
}

export interface TopServico {
  servicoId: string | null
  nome: string
  quantidade: number
  total: number
}

export interface ResumoEstoqueFinanceiro {
  valorCusto: number
  valorVenda: number
  lucroPotencial: number
}

export interface AlertaFinanceiro {
  tipo:
    | 'conta_vencendo_hoje'
    | 'conta_vencida'
    | 'pendencia_30_dias'
    | 'saldo_baixo'
    | 'diferenca_caixa'
    | 'receita_abaixo_media'
  titulo: string
  descricao: string
  severidade: 'aviso' | 'critico'
}
