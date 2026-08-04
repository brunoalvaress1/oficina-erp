import type { Produto } from '@/features/produtos/types/produto'
import type { FornecedorSelect } from '@/features/fornecedores/types/fornecedor'
import { capitalizarPalavras } from '@/utils/format'
import type { Servico } from './servico'
import type { ItemOrdemInput, StatusAprovacaoItem, TipoItemOrdem } from './ordemServico'

export interface ItemExibicao {
  chave: string
  tipo: TipoItemOrdem
  descricao: string
  quantidade: number
  valorUnitario: number
  valorDesconto: number
  valorTotal: number
  valorCusto: number | null
  fornecedorId?: string | null
  fornecedorNome?: string | null
  numeroNota?: string | null
  statusAprovacao: StatusAprovacaoItem
}

export interface ItemOrdemForm {
  chave: string
  id?: string
  tipo: TipoItemOrdem
  produto: Produto | null
  servico: Servico | null
  fornecedor: FornecedorSelect | null
  numeroNota: string
  descricao: string
  quantidade: string
  valorUnitario: string
  valorCusto: string
  valorDesconto: string
  observacoes: string
  statusAprovacao: 'aguardando' | 'aprovado' | 'recusado'
}

export function criarItemVazio(tipo: TipoItemOrdem = 'produto_estoque'): ItemOrdemForm {
  return {
    chave: crypto.randomUUID(),
    tipo,
    produto: null,
    servico: null,
    fornecedor: null,
    numeroNota: '',
    descricao: '',
    quantidade: '1',
    valorUnitario: '',
    valorCusto: '',
    valorDesconto: '',
    observacoes: '',
    statusAprovacao: 'aguardando',
  }
}

export function itemEstaCompleto(item: ItemOrdemForm): boolean {
  const camposComuns = Boolean(item.descricao.trim() && Number(item.quantidade) > 0 && Number(item.valorUnitario) >= 0)
  if (!camposComuns) return false

  if (item.tipo === 'produto_estoque') return Boolean(item.produto)
  if (item.tipo === 'produto_terceirizado') {
    return Boolean(item.fornecedor && Number(item.valorCusto) > 0)
  }
  return true
}

export function calcularTotalItem(item: ItemOrdemForm): number {
  const quantidade = Number(item.quantidade) || 0
  const valorUnitario = Number(item.valorUnitario) || 0
  const desconto = Number(item.valorDesconto) || 0
  return quantidade * valorUnitario - desconto
}

export function calcularMargemItem(item: ItemOrdemForm): number | null {
  const venda = Number(item.valorUnitario)
  const custo = Number(item.valorCusto)
  if (!venda || !custo) return null
  return ((venda - custo) / custo) * 100
}

export function itemFormParaInput(item: ItemOrdemForm): ItemOrdemInput {
  return {
    tipo: item.tipo,
    produtoId: item.produto?.id,
    servicoId: item.servico?.id,
    fornecedorId: item.fornecedor?.id,
    numeroNota: item.numeroNota || undefined,
    descricao: capitalizarPalavras(item.descricao),
    quantidade: Number(item.quantidade),
    valorUnitario: Number(item.valorUnitario),
    valorCusto: item.valorCusto ? Number(item.valorCusto) : undefined,
    valorDesconto: item.valorDesconto ? Number(item.valorDesconto) : undefined,
    observacoes: item.observacoes || undefined,
  }
}

export function itemFormParaExibicao(item: ItemOrdemForm): ItemExibicao {
  return {
    chave: item.chave,
    tipo: item.tipo,
    descricao: capitalizarPalavras(item.descricao),
    quantidade: Number(item.quantidade) || 0,
    valorUnitario: Number(item.valorUnitario) || 0,
    valorDesconto: Number(item.valorDesconto) || 0,
    valorTotal: calcularTotalItem(item),
    valorCusto: item.valorCusto ? Number(item.valorCusto) : null,
    fornecedorId: item.fornecedor?.id,
    fornecedorNome: item.fornecedor?.nome,
    numeroNota: item.numeroNota || null,
    statusAprovacao: item.statusAprovacao,
  }
}
