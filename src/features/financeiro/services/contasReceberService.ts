import { supabase } from '@/lib/supabase'
import { capturarIpPublico } from '@/utils/capturarIp'
import type {
  BaixarContaReceberInput,
  ContaReceber,
  CriarContaReceberInput,
  ListarContasReceberParams,
  ListarContasReceberResult,
} from '../types/contaReceber'

const SELECT_CONTA_RECEBER = `
  *,
  clientes (nome),
  categorias_financeiras (nome),
  centros_custo (nome),
  responsavel:funcionarios!contas_receber_responsavel_id_fkey (nome)
`

function calcularStatusExibicao(row: any): ContaReceber['status'] {
  if (row.status === 'cancelado' || row.status === 'recebido') return row.status
  const vencimento = new Date(`${row.data_vencimento}T00:00:00`)
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  if (vencimento < hoje) return 'atrasado'
  return row.status
}

function mapRow(row: any): ContaReceber {
  return {
    id: row.id,
    oficinaId: row.oficina_id,
    documento: row.documento,
    clienteId: row.cliente_id,
    clienteNome: row.clientes?.nome ?? null,
    clienteNomeAvulso: row.cliente_nome_avulso,
    descricao: row.descricao,
    categoriaId: row.categoria_id,
    categoriaNome: row.categorias_financeiras?.nome ?? null,
    centroCustoId: row.centro_custo_id,
    centroCustoNome: row.centros_custo?.nome ?? null,
    valor: Number(row.valor ?? 0),
    valorRecebido: Number(row.valor_recebido ?? 0),
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
  if (mensagem.includes('CONTA_RECEBER_JA_FINALIZADA')) return 'Essa conta já foi recebida ou cancelada.'
  if (mensagem.includes('CONTA_RECEBER_JA_RECEBIDA')) return 'Essa conta já foi recebida — não é possível cancelar.'
  if (mensagem.includes('CONTA_RECEBER_NAO_ENCONTRADA')) return 'Conta a receber não encontrada.'
  return mensagem
}

export async function listarContasReceber(
  oficinaId: string,
  params: ListarContasReceberParams = {},
): Promise<ListarContasReceberResult> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 20
  const search = params.search?.trim() ?? ''
  const status = params.status ?? 'todas'

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase.from('contas_receber').select(SELECT_CONTA_RECEBER, { count: 'exact' }).eq('oficina_id', oficinaId)

  if (status === 'atrasado') {
    query = query.lt('data_vencimento', new Date().toISOString().slice(0, 10)).in('status', ['pendente', 'parcial'])
  } else if (status !== 'todas') {
    query = query.eq('status', status)
  }

  if (search) {
    const termo = search.replace(/,/g, ' ')
    query = query.or(`descricao.ilike.%${termo}%,documento.ilike.%${termo}%,cliente_nome_avulso.ilike.%${termo}%`)
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

export async function criarContaReceber(
  input: CriarContaReceberInput,
  oficinaId: string,
  funcionarioId: string,
): Promise<string> {
  const ip = await capturarIpPublico()
  const { data, error } = await supabase.rpc('financeiro_criar_conta_receber', {
    p_oficina_id: oficinaId,
    p_funcionario_id: funcionarioId,
    p_ip: ip,
    p_documento: input.documento || null,
    p_cliente_id: input.clienteId || null,
    p_cliente_nome_avulso: input.clienteNomeAvulso || null,
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

export async function baixarContaReceber(input: BaixarContaReceberInput, funcionarioId: string): Promise<void> {
  const ip = await capturarIpPublico()
  const { error } = await supabase.rpc('financeiro_baixar_conta_receber', {
    p_conta_receber_id: input.contaReceberId,
    p_funcionario_id: funcionarioId,
    p_ip: ip,
    p_valor: input.valor,
    p_conta_bancaria_id: input.contaBancariaId || null,
    p_forma_pagamento: input.formaPagamento || null,
    p_data_recebimento: input.dataRecebimento || null,
    p_categoria_id: input.categoriaId || null,
    p_observacoes: input.observacoes || null,
  })
  if (error) throw new Error(traduzirErro(error.message))
}

export async function cancelarContaReceber(contaReceberId: string, funcionarioId: string, motivo: string): Promise<void> {
  const ip = await capturarIpPublico()
  const { error } = await supabase.rpc('financeiro_cancelar_conta_receber', {
    p_conta_receber_id: contaReceberId,
    p_funcionario_id: funcionarioId,
    p_ip: ip,
    p_motivo: motivo,
  })
  if (error) throw new Error(traduzirErro(error.message))
}
