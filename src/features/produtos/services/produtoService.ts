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

  let query = supabase.from('produtos').select('*, impostos(nome)', { count: 'exact' })

  if (search) {
    const termo = search.replace(/,/g, ' ')
    query = query.or(
      `nome.ilike.%${termo}%,ncm.ilike.%${termo}%,categoria.ilike.%${termo}%,subcategoria.ilike.%${termo}%,marca.ilike.%${termo}%,codigo_fabricante.ilike.%${termo}%,codigo_interno.ilike.%${termo}%`,
    )
  }

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

// Busca "inteligente" para o seletor de produto do Lançar Estoque: nome,
// código interno/fabricante ou código de barras. Sem termo, devolve os
// primeiros produtos por nome (mesma lista que aparece na tela de Produtos)
// em vez de ficar vazio até o usuário digitar algo.
export async function buscarProdutosParaEstoque(termo: string): Promise<Produto[]> {
  const texto = termo.trim()

  if (!texto) {
    const { data, error } = await supabase.from('produtos').select('*').order('nome').limit(20)
    if (error) throw new Error(error.message)
    return (data ?? []).map(mapRow)
  }

  const escapado = texto.replace(/,/g, ' ')
  const { data, error } = await supabase
    .from('produtos')
    .select('*')
    .or(
      `nome.ilike.%${escapado}%,codigo_fabricante.ilike.%${escapado}%,codigo_interno.ilike.%${escapado}%,codigo_barras.ilike.%${escapado}%`,
    )
    .order('nome')
    .limit(20)

  if (error) throw new Error(error.message)
  return (data ?? []).map(mapRow)
}
