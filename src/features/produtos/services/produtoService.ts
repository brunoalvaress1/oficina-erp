import { supabase } from '@/lib/supabase'
import type {
  CampoOrdenacaoProduto,
  ListarProdutosParams,
  ListarProdutosResult,
  Produto,
  ProdutoInput,
} from '../types/produto'

const COLUNA_POR_CAMPO: Record<CampoOrdenacaoProduto, string> = {
  nome: 'nome',
  categoria: 'categoria',
  marca: 'marca',
  valorCusto: 'valor_custo',
  valorOs: 'valor_os',
  estoqueFisico: 'estoque_fisico',
  ncm: 'ncm',
}

function mapRow(row: any): Produto {
  return {
    id: row.id,
    oficinaId: row.oficina_id,
    nome: row.nome,
    categoria: row.categoria,
    subcategoria: row.subcategoria,
    marca: row.marca,
    codigoFabricante: row.codigo_fabricante,
    codigoInterno: row.codigo_interno,
    valorCusto: Number(row.valor_custo ?? 0),
    custoMedio: Number(row.custo_medio ?? 0),
    valorOs: Number(row.valor_os ?? 0),
    estoqueFisico: Number(row.estoque_fisico ?? 0),
    estoqueMinimo: row.estoque_minimo === null || row.estoque_minimo === undefined ? null : Number(row.estoque_minimo),
    estoqueIdeal: row.estoque_ideal === null || row.estoque_ideal === undefined ? null : Number(row.estoque_ideal),
    codigoBarras: row.codigo_barras,
    ncm: row.ncm,
    impostoId: row.imposto_id,
    impostoNome: row.impostos?.nome ?? null,
    observacoes: row.observacoes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listarProdutos(params: ListarProdutosParams = {}): Promise<ListarProdutosResult> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 20
  const search = params.search?.trim() ?? ''

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // Com termo de busca, usa a mesma RPC produtos_buscar do seletor de
  // produto (pg_trgm) — acha mesmo com erro de digitação/acento faltando, e
  // já vem rankeada por relevância, então ignora o sortBy escolhido (faz
  // sentido só quando está navegando o catálogo, não procurando algo
  // específico). Sem termo, mantém a consulta simples de sempre com
  // ordenação por coluna.
  if (search) {
    // p_limit/p_offset da RPC ficam nos valores padrão (um teto de
    // segurança, não a página) — quem corta a página de verdade é o
    // .range() aqui embaixo, senão a contagem total (pro "X de Y") saía
    // sempre travada no tamanho da página.
    const { data, count, error } = await supabase.rpc('produtos_buscar', { p_termo: search }, { count: 'exact' }).range(from, to)

    if (error) throw new Error(error.message)

    return {
      data: (data ?? []).map(mapRow),
      total: count ?? 0,
      page,
      pageSize,
    }
  }

  const query = supabase.from('produtos').select('*, impostos(nome)', { count: 'exact' })

  const coluna = COLUNA_POR_CAMPO[params.sortBy ?? 'nome']
  const ascendente = params.sortDirection !== 'desc'

  const { data, count, error } = await query.order(coluna, { ascending: ascendente }).range(from, to)

  if (error) throw new Error(error.message)

  return {
    data: (data ?? []).map(mapRow),
    total: count ?? 0,
    page,
    pageSize,
  }
}

export async function criarProduto(input: ProdutoInput, oficinaId: string): Promise<Produto> {
  const { data, error } = await supabase
    .from('produtos')
    .insert({
      oficina_id: oficinaId,
      nome: input.nome,
      categoria: input.categoria || null,
      subcategoria: input.subcategoria || null,
      marca: input.marca || null,
      codigo_fabricante: input.codigoFabricante || null,
      codigo_interno: input.codigoInterno || null,
      codigo_barras: input.codigoBarras || null,
      valor_custo: input.valorCusto ?? 0,
      valor_os: input.valorOs ?? 0,
      estoque_fisico: input.estoqueFisico ?? 0,
      estoque_minimo: input.estoqueMinimo ?? null,
      estoque_ideal: input.estoqueIdeal ?? null,
      ncm: input.ncm || null,
      imposto_id: input.impostoId || null,
      observacoes: input.observacoes || null,
    })
    .select('*, impostos(nome)')
    .single()

  if (error) throw new Error(error.message)
  return mapRow(data)
}

export async function atualizarProduto(id: string, input: ProdutoInput): Promise<Produto> {
  const { data, error } = await supabase
    .from('produtos')
    .update({
      nome: input.nome,
      categoria: input.categoria || null,
      subcategoria: input.subcategoria || null,
      marca: input.marca || null,
      codigo_fabricante: input.codigoFabricante || null,
      codigo_interno: input.codigoInterno || null,
      codigo_barras: input.codigoBarras || null,
      valor_custo: input.valorCusto ?? 0,
      valor_os: input.valorOs ?? 0,
      estoque_fisico: input.estoqueFisico ?? 0,
      estoque_minimo: input.estoqueMinimo ?? null,
      estoque_ideal: input.estoqueIdeal ?? null,
      ncm: input.ncm || null,
      imposto_id: input.impostoId || null,
      observacoes: input.observacoes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*, impostos(nome)')
    .single()

  if (error) throw new Error(error.message)
  return mapRow(data)
}

export async function excluirProduto(id: string): Promise<void> {
  const { error } = await supabase.from('produtos').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// Busca "inteligente" para o seletor de produto (Ordem de Serviço, Lançar
// Estoque, Movimento de Estoque): nome, categoria, marca ou código — e
// TOLERA erro de digitação (letra faltando/trocada), não só falta de acento.
// Usa a RPC produtos_buscar (pg_trgm) em vez de ilike puro: ela mesma rankeia
// quem bateu certinho primeiro e só desce pra "parecido" depois. Sem termo,
// devolve os primeiros produtos por nome (mesma lista da tela de Produtos)
// em vez de ficar vazio até o usuário digitar algo.
export async function buscarProdutosParaEstoque(termo: string): Promise<Produto[]> {
  const { data, error } = await supabase.rpc('produtos_buscar', { p_termo: termo.trim(), p_limit: 20 })
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapRow)
}
