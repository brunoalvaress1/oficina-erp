import { supabase } from '@/lib/supabase'
import { capturarIpPublico } from '@/utils/capturarIp'
import type {
  LancarEstoqueInput,
  ListarNotasFiscaisParams,
  ListarNotasFiscaisResult,
  NotaFiscalDetalhe,
  NotaFiscalEntrada,
  NotaFiscalHistoricoEntry,
  NotaFiscalItem,
  NotaFiscalItemInput,
} from '../types/notaFiscal'

function mapNota(row: any): NotaFiscalEntrada {
  return {
    id: row.id,
    oficinaId: row.oficina_id,
    fornecedorId: row.fornecedor_id,
    fornecedorNome: row.fornecedores?.nome ?? null,
    numeroNota: row.numero_nota,
    dataNota: row.data_nota,
    dataEntrada: row.data_entrada,
    valorProdutos: Number(row.valor_produtos ?? 0),
    observacoes: row.observacoes,
    criadoPor: row.criado_por,
    criadoPorNome: row.funcionarios?.nome ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapItem(row: any): NotaFiscalItem {
  return {
    id: row.id,
    notaFiscalId: row.nota_fiscal_id,
    produtoId: row.produto_id,
    produtoNome: row.produtos?.nome ?? null,
    quantidade: Number(row.quantidade),
    valorCustoAnterior: row.valor_custo_anterior === null ? null : Number(row.valor_custo_anterior),
    valorCustoAtual: Number(row.valor_custo_atual),
    custoMedioResultante: row.custo_medio_resultante === null ? null : Number(row.custo_medio_resultante),
    valorVendaOs: row.valor_venda_os === null ? null : Number(row.valor_venda_os),
    ncm: row.ncm,
    cest: row.cest,
    cfop: row.cfop,
    classeImposto: row.classe_imposto,
    origem: row.origem,
    situacaoTributaria: row.situacao_tributaria,
    cstPisCofins: row.cst_pis_cofins,
    cstIpi: row.cst_ipi,
    observacoes: row.observacoes,
    createdAt: row.created_at,
  }
}

function mapHistorico(row: any): NotaFiscalHistoricoEntry {
  return {
    id: row.id,
    notaFiscalId: row.nota_fiscal_id,
    funcionarioId: row.funcionario_id,
    funcionarioNome: row.funcionarios?.nome ?? null,
    acao: row.acao,
    detalhes: row.detalhes,
    ip: row.ip,
    createdAt: row.created_at,
  }
}

function itemParaRpc(item: NotaFiscalItemInput) {
  return {
    produtoId: item.produtoId,
    quantidade: item.quantidade,
    valorCustoAtual: item.valorCustoAtual,
    valorVendaOs: item.valorVendaOs ?? '',
    ncm: item.ncm ?? '',
    cest: item.cest ?? '',
    cfop: item.cfop ?? '',
    classeImposto: item.classeImposto ?? '',
    origem: item.origem ?? '',
    situacaoTributaria: item.situacaoTributaria ?? '',
    cstPisCofins: item.cstPisCofins ?? '',
    cstIpi: item.cstIpi ?? '',
    observacoes: item.observacoes ?? '',
  }
}

export async function lancarEstoque(
  input: LancarEstoqueInput,
  oficinaId: string,
  funcionarioId: string,
): Promise<string> {
  const ip = await capturarIpPublico()

  const { data, error } = await supabase.rpc('lancar_estoque', {
    p_oficina_id: oficinaId,
    p_fornecedor_id: input.fornecedorId,
    p_numero_nota: input.numeroNota,
    p_data_nota: input.dataNota,
    p_data_entrada: input.dataEntrada,
    p_observacoes: input.observacoes || null,
    p_funcionario_id: funcionarioId,
    p_ip: ip,
    p_itens: input.itens.map(itemParaRpc),
  })

  if (error) {
    if (error.message.includes('NOTA_DUPLICADA')) {
      throw new Error('Esta Nota Fiscal já foi lançada anteriormente.')
    }
    if (error.message.includes('ESTOQUE_NEGATIVO')) {
      throw new Error('Essa operação deixaria o estoque de algum produto negativo.')
    }
    throw new Error(error.message)
  }

  return data as string
}

export async function adicionarItemNota(
  notaFiscalId: string,
  funcionarioId: string,
  item: NotaFiscalItemInput,
): Promise<string> {
  const ip = await capturarIpPublico()
  const { data, error } = await supabase.rpc('nota_fiscal_adicionar_item', {
    p_nota_fiscal_id: notaFiscalId,
    p_funcionario_id: funcionarioId,
    p_ip: ip,
    p_item: itemParaRpc(item),
  })
  if (error) {
    if (error.message.includes('ESTOQUE_NEGATIVO')) {
      throw new Error('Essa operação deixaria o estoque do produto negativo.')
    }
    throw new Error(error.message)
  }
  return data as string
}

export async function removerItemNota(itemId: string, funcionarioId: string): Promise<void> {
  const ip = await capturarIpPublico()
  const { error } = await supabase.rpc('nota_fiscal_remover_item', {
    p_item_id: itemId,
    p_funcionario_id: funcionarioId,
    p_ip: ip,
  })
  if (error) {
    if (error.message.includes('ESTOQUE_NEGATIVO')) {
      throw new Error('Remover esse item deixaria o estoque do produto negativo.')
    }
    throw new Error(error.message)
  }
}

export async function listarNotasFiscais(params: ListarNotasFiscaisParams = {}): Promise<ListarNotasFiscaisResult> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 20
  const search = params.search?.trim() ?? ''

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('notas_fiscais_entrada')
    .select('*, fornecedores(nome), funcionarios(nome)', { count: 'exact' })

  if (search) {
    query = query.ilike('numero_nota', `%${search.replace(/,/g, ' ')}%`)
  }

  const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to)
  if (error) throw new Error(error.message)

  return {
    data: (data ?? []).map(mapNota),
    total: count ?? 0,
    page,
    pageSize,
  }
}

export async function buscarNotaFiscalDetalhe(notaFiscalId: string): Promise<NotaFiscalDetalhe> {
  const [notaResp, itensResp, historicoResp] = await Promise.all([
    supabase.from('notas_fiscais_entrada').select('*, fornecedores(nome), funcionarios(nome)').eq('id', notaFiscalId).single(),
    supabase.from('nota_fiscal_itens').select('*, produtos(nome)').eq('nota_fiscal_id', notaFiscalId).order('created_at'),
    supabase
      .from('nota_fiscal_historico')
      .select('*, funcionarios(nome)')
      .eq('nota_fiscal_id', notaFiscalId)
      .order('created_at', { ascending: false }),
  ])

  if (notaResp.error) throw new Error(notaResp.error.message)
  if (itensResp.error) throw new Error(itensResp.error.message)
  if (historicoResp.error) throw new Error(historicoResp.error.message)

  return {
    nota: mapNota(notaResp.data),
    itens: (itensResp.data ?? []).map(mapItem),
    historico: (historicoResp.data ?? []).map(mapHistorico),
  }
}
