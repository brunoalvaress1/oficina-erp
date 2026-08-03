import { supabase } from '@/lib/supabase'

export interface ItemRecusado {
  id: string
  descricao: string
  quantidade: number
  valorUnitario: number
  valorTotal: number
  ordemServicoId: string
  ordemServicoNumero: number
  clienteNome: string | null
  veiculoPlaca: string | null
  updatedAt: string
}

export interface ListarItensRecusadosParams {
  page?: number
  pageSize?: number
  search?: string
}

export interface ListarItensRecusadosResult {
  data: ItemRecusado[]
  total: number
  page: number
  pageSize: number
}

function mapRow(row: any): ItemRecusado {
  return {
    id: row.id,
    descricao: row.descricao,
    quantidade: Number(row.quantidade),
    valorUnitario: Number(row.valor_unitario),
    valorTotal: Number(row.valor_total ?? 0),
    ordemServicoId: row.ordem_servico_id,
    ordemServicoNumero: Number(row.ordens_servico?.numero ?? 0),
    clienteNome: row.ordens_servico?.clientes?.nome ?? null,
    veiculoPlaca: row.ordens_servico?.veiculos?.placa ?? null,
    updatedAt: row.updated_at,
  }
}

export async function listarItensRecusados(params: ListarItensRecusadosParams = {}): Promise<ListarItensRecusadosResult> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 20
  const search = params.search?.trim() ?? ''

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('ordem_servico_itens')
    .select('*, ordens_servico!inner(numero, clientes(nome), veiculos(placa))', { count: 'exact' })
    .eq('status_aprovacao', 'recusado')

  if (search) {
    query = query.ilike('descricao', `%${search.replace(/,/g, ' ')}%`)
  }

  const { data, count, error } = await query.order('updated_at', { ascending: false }).range(from, to)
  if (error) throw new Error(error.message)

  return {
    data: (data ?? []).map(mapRow),
    total: count ?? 0,
    page,
    pageSize,
  }
}
