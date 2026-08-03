import { supabase } from '@/lib/supabase'
import type { ContaBancaria } from '../types/contaBancaria'

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

export async function buscarContasBancarias(termo: string): Promise<ContaBancaria[]> {
  let query = supabase.from('contas_bancarias').select('*').eq('ativo', true).order('nome').limit(20)

  if (termo.trim()) {
    query = query.ilike('nome', `%${termo.trim().replace(/,/g, ' ')}%`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapRow)
}

export async function criarContaBancaria(nome: string, oficinaId: string): Promise<ContaBancaria> {
  const { data, error } = await supabase
    .from('contas_bancarias')
    .insert({ oficina_id: oficinaId, nome })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return mapRow(data)
}
