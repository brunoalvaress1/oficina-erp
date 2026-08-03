import { supabase } from '@/lib/supabase'
import { capturarIpPublico } from '@/utils/capturarIp'
import type { ContaBancaria, TipoContaBancaria } from '@/features/caixa/types/contaBancaria'
import type { CriarTransferenciaInput, TransferenciaBancaria } from '../types/transferenciaBancaria'

function mapRow(row: any): ContaBancaria {
  return {
    id: row.id,
    oficinaId: row.oficina_id,
    nome: row.nome,
    banco: row.banco,
    agencia: row.agencia,
    conta: row.conta,
    pix: row.pix,
    tipo: row.tipo,
    saldoInicial: Number(row.saldo_inicial ?? 0),
    saldoMinimoAlerta: row.saldo_minimo_alerta != null ? Number(row.saldo_minimo_alerta) : null,
    ativo: row.ativo,
    createdAt: row.created_at,
  }
}

function mapTransferencia(row: any): TransferenciaBancaria {
  return {
    id: row.id,
    oficinaId: row.oficina_id,
    contaOrigemId: row.conta_origem_id,
    contaOrigemNome: row.conta_origem?.nome ?? null,
    contaDestinoId: row.conta_destino_id,
    contaDestinoNome: row.conta_destino?.nome ?? null,
    valor: Number(row.valor ?? 0),
    dataTransferencia: row.data_transferencia,
    observacoes: row.observacoes,
    funcionarioId: row.funcionario_id,
    funcionarioNome: row.funcionarios?.nome ?? null,
    createdAt: row.created_at,
  }
}

function traduzirErro(mensagem: string): string {
  if (mensagem.includes('CONTAS_IGUAIS')) return 'A conta de origem e destino não podem ser iguais.'
  if (mensagem.includes('VALOR_INVALIDO')) return 'Informe um valor válido.'
  if (mensagem.includes('CONTA_NAO_ENCONTRADA')) return 'Conta bancária não encontrada.'
  return mensagem
}

export interface ContaBancariaInput {
  nome: string
  banco?: string
  agencia?: string
  conta?: string
  pix?: string
  tipo?: TipoContaBancaria
  saldoInicial?: number
  saldoMinimoAlerta?: number | null
  ativo?: boolean
}

export async function listarContasBancarias(): Promise<ContaBancaria[]> {
  const { data, error } = await supabase.from('contas_bancarias').select('*').order('nome')
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapRow)
}

export async function criarContaBancariaCompleta(input: ContaBancariaInput, oficinaId: string): Promise<ContaBancaria> {
  const { data, error } = await supabase
    .from('contas_bancarias')
    .insert({
      oficina_id: oficinaId,
      nome: input.nome,
      banco: input.banco || null,
      agencia: input.agencia || null,
      conta: input.conta || null,
      pix: input.pix || null,
      tipo: input.tipo || null,
      saldo_inicial: input.saldoInicial ?? 0,
      saldo_minimo_alerta: input.saldoMinimoAlerta ?? null,
    })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return mapRow(data)
}

export async function atualizarContaBancaria(id: string, input: ContaBancariaInput): Promise<ContaBancaria> {
  const { data, error } = await supabase
    .from('contas_bancarias')
    .update({
      nome: input.nome,
      banco: input.banco || null,
      agencia: input.agencia || null,
      conta: input.conta || null,
      pix: input.pix || null,
      tipo: input.tipo || null,
      saldo_inicial: input.saldoInicial ?? 0,
      saldo_minimo_alerta: input.saldoMinimoAlerta ?? null,
      ativo: input.ativo ?? true,
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return mapRow(data)
}

export async function buscarSaldosContas(oficinaId: string): Promise<Record<string, number>> {
  const { data, error } = await supabase.rpc('financeiro_saldos_contas', { p_oficina_id: oficinaId })
  if (error) throw new Error(error.message)
  const mapa: Record<string, number> = {}
  for (const linha of data ?? []) {
    mapa[linha.conta_bancaria_id] = Number(linha.saldo_atual ?? 0)
  }
  return mapa
}

export async function criarTransferencia(
  input: CriarTransferenciaInput,
  oficinaId: string,
  funcionarioId: string,
): Promise<string> {
  const ip = await capturarIpPublico()
  const { data, error } = await supabase.rpc('financeiro_criar_transferencia', {
    p_oficina_id: oficinaId,
    p_funcionario_id: funcionarioId,
    p_ip: ip,
    p_conta_origem_id: input.contaOrigemId,
    p_conta_destino_id: input.contaDestinoId,
    p_valor: input.valor,
    p_data_transferencia: input.dataTransferencia || null,
    p_observacoes: input.observacoes || null,
  })
  if (error) throw new Error(traduzirErro(error.message))
  return data as string
}

export async function listarTransferencias(oficinaId: string): Promise<TransferenciaBancaria[]> {
  const { data, error } = await supabase
    .from('transferencias_bancarias')
    .select(
      '*, conta_origem:contas_bancarias!transferencias_bancarias_conta_origem_id_fkey(nome), conta_destino:contas_bancarias!transferencias_bancarias_conta_destino_id_fkey(nome), funcionarios(nome)',
    )
    .eq('oficina_id', oficinaId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw new Error(error.message)
  return (data ?? []).map(mapTransferencia)
}
