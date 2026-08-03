import { supabase } from '@/lib/supabase'
import type { EstoqueMovimentacao, ListarMovimentacoesParams, ListarMovimentacoesResult } from '../types/movimentacao'

function mapRow(row: any): EstoqueMovimentacao {
  return {
    id: row.id,
    oficinaId: row.oficina_id,
    produtoId: row.produto_id,
    produtoNome: row.produtos?.nome ?? null,
    tipo: row.tipo,
    quantidade: Number(row.quantidade),
    quantidadeAnterior: Number(row.quantidade_anterior),
    quantidadeResultante: Number(row.quantidade_resultante),
    notaFiscalId: row.nota_fiscal_id,
    numeroNota: row.notas_fiscais_entrada?.numero_nota ?? null,
    funcionarioId: row.funcionario_id,
    funcionarioNome: row.funcionarios?.nome ?? null,
    observacao: row.observacao,
    createdAt: row.created_at,
  }
}

export async function listarMovimentacoes(params: ListarMovimentacoesParams = {}): Promise<ListarMovimentacoesResult> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 20

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // Só usa !inner (join obrigatório) no embed de notas_fiscais_entrada quando um filtro
  // depende dele — assim movimentações sem nota (ajustes manuais, por ex.) continuam
  // aparecendo quando nenhum desses filtros está ativo.
  const precisaNotaInner = Boolean(params.fornecedorId || params.numeroNota)
  const embedNota = precisaNotaInner
    ? 'notas_fiscais_entrada!inner(numero_nota, fornecedor_id)'
    : 'notas_fiscais_entrada(numero_nota, fornecedor_id)'

  let query = supabase
    .from('estoque_movimentacoes')
    .select(`*, produtos(nome), funcionarios(nome), ${embedNota}`, { count: 'exact' })

  if (params.tipo) query = query.eq('tipo', params.tipo)
  if (params.produtoId) query = query.eq('produto_id', params.produtoId)
  if (params.funcionarioId) query = query.eq('funcionario_id', params.funcionarioId)
  if (params.dataInicio) query = query.gte('created_at', params.dataInicio)
  if (params.dataFim) query = query.lte('created_at', `${params.dataFim}T23:59:59`)
  if (params.fornecedorId) query = query.eq('notas_fiscais_entrada.fornecedor_id', params.fornecedorId)
  if (params.numeroNota) query = query.ilike('notas_fiscais_entrada.numero_nota', `%${params.numeroNota.replace(/,/g, ' ')}%`)

  const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to)
  if (error) throw new Error(error.message)

  return {
    data: (data ?? []).map(mapRow),
    total: count ?? 0,
    page,
    pageSize,
  }
}
