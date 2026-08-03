import type { Produto } from '@/features/produtos/types/produto'

export interface ItemEstoqueForm {
  chave: string
  produto: Produto | null
  quantidade: string
  valorCustoAtual: string
  valorVendaOs: string
  ncm: string
  cest: string
  cfop: string
  classeImposto: string
  origem: string
  situacaoTributaria: string
  cstPisCofins: string
  cstIpi: string
  observacoes: string
  mostrarFiscais: boolean
}

export function criarItemVazio(produto?: Produto): ItemEstoqueForm {
  return {
    chave: crypto.randomUUID(),
    produto: produto ?? null,
    quantidade: '',
    valorCustoAtual: produto ? String(produto.valorCusto || '') : '',
    valorVendaOs: produto ? String(produto.valorOs || '') : '',
    ncm: produto?.ncm ?? '',
    cest: '',
    cfop: '',
    classeImposto: '',
    origem: '',
    situacaoTributaria: '',
    cstPisCofins: '',
    cstIpi: '',
    observacoes: '',
    mostrarFiscais: false,
  }
}

export function itemEstaCompleto(item: ItemEstoqueForm): boolean {
  return Boolean(
    item.produto &&
      Number(item.quantidade) > 0 &&
      Number(item.valorCustoAtual) > 0 &&
      Number(item.valorVendaOs) > 0,
  )
}

export function calcularCustoMedio(item: ItemEstoqueForm): number | null {
  if (!item.produto) return null
  const quantidade = Number(item.quantidade) || 0
  const valorCustoAtual = Number(item.valorCustoAtual) || 0
  const estoqueAtual = item.produto.estoqueFisico
  const custoBaseAnterior = item.produto.custoMedio || item.produto.valorCusto || valorCustoAtual
  const novaQuantidade = estoqueAtual + quantidade
  if (novaQuantidade <= 0) return valorCustoAtual
  return (estoqueAtual * custoBaseAnterior + quantidade * valorCustoAtual) / novaQuantidade
}

export function calcularMargem(valorVenda: string, valorCusto: string): number | null {
  const venda = Number(valorVenda)
  const custo = Number(valorCusto)
  if (!venda || !custo) return null
  return ((venda - custo) / custo) * 100
}
