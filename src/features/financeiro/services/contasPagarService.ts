import { supabase } from '@/lib/supabase'
import { capturarIpPublico } from '@/utils/capturarIp'
import type {
  BaixarContaPagarInput,
  ContaPagar,
  CriarContaPagarInput,
  ListarContasPagarParams,
  ListarContasPagarResult,
} from '../types/contaPagar'

const SELECT_CONTA_PAGAR = `
  *,
  fornecedores (nome),
  categorias_financeiras (nome),
  centros_custo (nome),
  responsavel:funcionarios!contas_pagar_responsavel_id_fkey (nome)
`

function calcularStatusExibicao(row: any): ContaPagar['status'] {
  if (row.status === 'cancelado' || row.status === 'pago') return row.status
  const vencimento = new Date(`${row.data_vencimento}T00:00:00`)
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  if (vencimento < hoje) return 'atrasado'
  return row.status
}

function mapRow(row: any): ContaPagar {
  return {
    id: row.id,
    oficinaId: row.oficina_id,
    fornecedorId: row.fornecedor_id,
    fornecedorNome: row.fornecedores?.nome ?? null,
    descricao: row.descricao,
    categoriaId: row.categoria_id,
    categoriaNome: row.categorias_financeiras?.nome ?? null,
    centroCustoId: row.centro_custo_id,
    centroCustoNome: row.centros_custo?.nome ?? null,
    valor: Number(row.valor ?? 0),
    valorPago: Number(row.valor_pago ?? 0),
    dataVencimento: row.data_vencimento,
    status: calcularStatusExibicao(row),
    responsavelId: row.responsavel_id,
    responsavelNome: row.responsavel?.nome ?? null,
    observacoes: row.observacoes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function traduzirErro(mensagem: string): string {
  if (mensagem.includes('VALOR_INVALIDO')) return 'Informe um valor válido.'
  if (mensagem.includes('VALOR_EXCEDE_SALDO')) return 'O valor informado é maior que o saldo pendente dessa conta.'
  if (mensagem.includes('CONTA_PAGAR_JA_FINALIZADA')) return 'Essa conta já foi paga ou cancelada.'
  if (mensagem.includes('CONTA_PAGAR_JA_PAGA')) return 'Essa conta já foi paga — não é possível cancelar.'
  if (mensagem.includes('CONTA_PAGAR_NAO_ENCONTRADA')) return 'Conta a pagar não encontrada.'
  return mensagem
}

export async function listarContasPagar(
  oficinaId: string,
  params: ListarContasPagarParams = {},
): Promise<ListarContasPagarResult> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 20
  const search = params.search?.trim() ?? ''
  const status = params.status ?? 'todas'

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase.from('contas_pagar').select(SELECT_CONTA_PAGAR, { count: 'exact' }).eq('oficina_id', oficinaId)

  if (status === 'atrasado') {
    query = query.lt('data_vencimento', new Date().toISOString().slice(0, 10)).in('status', ['pendente', 'parcial'])
  } else if (status !== 'todas') {
    query = query.eq('status', status)
  }

  if (search) {
    const termo = search.replace(/,/g, ' ')
    query = query.ilike('descricao', `%${termo}%`)
  }

  const { data, count, error } = await query.order('data_vencimento', { ascending: true }).range(from, to)
  if (error) throw new Error(error.message)

  return {
    data: (data ?? []).map(mapRow),
    total: count ?? 0,
    page,
    pageSize,
  }
}

export async function criarContaPagar(input: CriarContaPagarInput, oficinaId: string, funcionarioId: string): Promise<string> {
  const ip = await capturarIpPublico()
  const { data, error } = await supabase.rpc('financeiro_criar_conta_pagar', {
    p_oficina_id: oficinaId,
    p_funcionario_id: funcionarioId,
    p_ip: ip,
    p_fornecedor_id: input.fornecedorId || null,
    p_descricao: input.descricao,
    p_categoria_id: input.categoriaId || null,
    p_centro_custo_id: input.centroCustoId || null,
    p_valor: input.valor,
    p_data_vencimento: input.dataVencimento,
    p_observacoes: input.observacoes || null,
  })
  if (error) throw new Error(traduzirErro(error.message))
  return data as string
}

export async function baixarContaPagar(input: BaixarContaPagarInput, funcionarioId: string): Promise<void> {
  const ip = await capturarIpPublico()
  const { error } = await supabase.rpc('financeiro_baixar_conta_pagar', {
    p_conta_pagar_id: input.contaPagarId,
    p_funcionario_id: funcionarioId,
    p_ip: ip,
    p_valor: input.valor,
    p_conta_bancaria_id: input.contaBancariaId || null,
    p_forma_pagamento: input.formaPagamento || null,
    p_data_pagamento: input.dataPagamento || null,
    p_categoria_id: input.categoriaId || null,
    p_observacoes: input.observacoes || null,
  })
  if (error) throw new Error(traduzirErro(error.message))
}

export async function cancelarContaPagar(contaPagarId: string, funcionarioId: string, motivo: string): Promise<void> {
  const ip = await capturarIpPublico()
  const { error } = await supabase.rpc('financeiro_cancelar_conta_pagar', {
    p_conta_pagar_id: contaPagarId,
    p_funcionario_id: funcionarioId,
    p_ip: ip,
    p_motivo: motivo,
  })
  if (error) throw new Error(traduzirErro(error.message))
}
