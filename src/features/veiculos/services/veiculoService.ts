import { supabase } from '@/lib/supabase'
import type {
  CampoOrdenacaoVeiculo,
  ListarVeiculosParams,
  ListarVeiculosResult,
  Veiculo,
  VeiculoInput,
} from '../types/veiculo'

const COLUNA_POR_CAMPO: Record<CampoOrdenacaoVeiculo, string> = {
  placa: 'placa',
  modelo: 'modelo',
  marca: 'marca',
  clienteNome: 'cliente_nome',
}

function mapRow(row: any): Veiculo {
  return {
    id: row.id,
    oficinaId: row.oficina_id,
    clienteId: row.cliente_id,
    clienteNome: row.clientes?.nome,
    placa: row.placa,
    marca: row.marca,
    modelo: row.modelo,
    cor: row.cor,
    ano: row.ano,
    anoModelo: row.ano_modelo,
    chassi: row.chassi,
    kmAtual: row.km_atual,
    combustivel: row.combustivel,
    motor: row.motor,
    opcionais: row.opcionais,
    observacoes: row.observacoes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// Lê da view veiculos_lista (cliente_nome já achatado) em vez da tabela +
// embed usada em mapRow — ver comentário na migration da view: ordenar por
// coluna de tabela relacionada embutida (clientes(nome)) não funciona no
// PostgREST, só uma coluna de primeiro nível ordena de verdade.
function mapVeiculoLista(row: any): Veiculo {
  return {
    id: row.id,
    oficinaId: row.oficina_id,
    clienteId: row.cliente_id,
    clienteNome: row.cliente_nome,
    placa: row.placa,
    marca: row.marca,
    modelo: row.modelo,
    cor: row.cor,
    ano: row.ano,
    anoModelo: row.ano_modelo,
    chassi: row.chassi,
    kmAtual: row.km_atual,
    combustivel: row.combustivel,
    motor: row.motor,
    opcionais: row.opcionais,
    observacoes: row.observacoes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function buscarVeiculoPorId(id: string): Promise<Veiculo> {
  const { data, error } = await supabase.from('veiculos').select('*, clientes (nome)').eq('id', id).single()
  if (error) throw new Error(error.message)
  return mapRow(data)
}

export async function buscarVeiculoPorPlaca(placa: string): Promise<Veiculo | null> {
  const { data, error } = await supabase
    .from('veiculos')
    .select('*, clientes (nome)')
    .eq('placa', placa.toUpperCase())
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data ? mapRow(data) : null
}

export async function listarVeiculos(params: ListarVeiculosParams = {}): Promise<ListarVeiculosResult> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 20
  const search = params.search?.trim() ?? ''

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase.from('veiculos_lista').select('*', { count: 'exact' })

  if (search) {
    const termo = search.replace(/,/g, ' ')
    query = query.or(`placa.ilike.%${termo}%,modelo.ilike.%${termo}%,marca.ilike.%${termo}%,cliente_nome.ilike.%${termo}%`)
  }

  const coluna = COLUNA_POR_CAMPO[params.sortBy ?? 'placa']
  const ascendente = params.sortDirection !== 'desc'

  const { data, count, error } = await query.order(coluna, { ascending: ascendente }).range(from, to)

  if (error) throw new Error(error.message)

  return {
    data: (data ?? []).map(mapVeiculoLista),
    total: count ?? 0,
    page,
    pageSize,
  }
}

export async function criarVeiculo(input: VeiculoInput, oficinaId: string): Promise<Veiculo> {
  const { data, error } = await supabase
    .from('veiculos')
    .insert({
      oficina_id: oficinaId,
      cliente_id: input.clienteId,
      placa: input.placa,
      marca: input.marca || null,
      modelo: input.modelo,
      cor: input.cor || null,
      ano: input.ano || null,
      ano_modelo: input.anoModelo || null,
      chassi: input.chassi || null,
      km_atual: input.kmAtual ?? null,
      combustivel: input.combustivel || null,
      motor: input.motor || null,
      opcionais: input.opcionais || null,
      observacoes: input.observacoes || null,
    })
    .select('*, clientes (nome)')
    .single()

  if (error) throw new Error(error.message)
  return mapRow(data)
}

export async function atualizarVeiculo(id: string, input: VeiculoInput): Promise<Veiculo> {
  const { data, error } = await supabase
    .from('veiculos')
    .update({
      cliente_id: input.clienteId,
      placa: input.placa,
      marca: input.marca || null,
      modelo: input.modelo,
      cor: input.cor || null,
      ano: input.ano || null,
      ano_modelo: input.anoModelo || null,
      chassi: input.chassi || null,
      km_atual: input.kmAtual ?? null,
      combustivel: input.combustivel || null,
      motor: input.motor || null,
      opcionais: input.opcionais || null,
      observacoes: input.observacoes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*, clientes (nome)')
    .single()

  if (error) throw new Error(error.message)
  return mapRow(data)
}

export async function excluirVeiculo(id: string): Promise<void> {
  const { error } = await supabase.from('veiculos').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function buscarVeiculosParaOS(termo: string): Promise<Veiculo[]> {
  const texto = termo.trim()

  if (!texto) {
    const { data, error } = await supabase
      .from('veiculos')
      .select('*, clientes (nome)')
      .order('placa')
      .limit(20)
    if (error) throw new Error(error.message)
    return (data ?? []).map(mapRow)
  }

  const escapado = texto.replace(/,/g, ' ')
  const { data, error } = await supabase
    .from('veiculos')
    .select('*, clientes (nome)')
    .or(`placa.ilike.%${escapado}%,modelo.ilike.%${escapado}%,marca.ilike.%${escapado}%`)
    .order('placa')
    .limit(20)

  if (error) throw new Error(error.message)
  return (data ?? []).map(mapRow)
}