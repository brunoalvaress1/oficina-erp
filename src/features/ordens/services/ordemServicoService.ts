import { supabase } from '@/lib/supabase'
import { capturarIpPublico } from '@/utils/capturarIp'
import type {
  AtualizarCabecalhoInput,
  CampoOrdenacaoOrdem,
  CriarOrdemServicoInput,
  ItemOrdemInput,
  ListarOrdensParams,
  ListarOrdensResult,
  OrdemServico,
  OrdemServicoDetalhe,
  OrdemServicoHistoricoEntry,
  OrdemServicoItem,
} from '../types/ordemServico'

const COLUNA_POR_CAMPO: Record<CampoOrdenacaoOrdem, string> = {
  numero: 'numero',
  dataAbertura: 'data_abertura',
  status: 'status',
  valorTotal: 'valor_total',
}

const SELECT_ORDEM = `
  *,
  clientes (nome, cpf_cnpj, telefone),
  veiculos (placa, modelo),
  responsavel:funcionarios!ordens_servico_responsavel_id_fkey (nome),
  mecanico:funcionarios!ordens_servico_mecanico_id_fkey (nome)
`

function selectOrdemParaLista(precisaFiltrarPorNota: boolean): string {
  const embedItens = precisaFiltrarPorNota ? 'ordem_servico_itens!inner(numero_nota)' : ''
  return embedItens ? `${SELECT_ORDEM}, ${embedItens}` : SELECT_ORDEM
}

function mapOrdem(row: any): OrdemServico {
  return {
    id: row.id,
    numero: Number(row.numero),
    oficinaId: row.oficina_id,
    numeroPrisma: row.numero_prisma,
    clienteId: row.cliente_id,
    clienteNome: row.clientes?.nome,
    veiculoId: row.veiculo_id,
    veiculoPlaca: row.veiculos?.placa,
    veiculoModelo: row.veiculos?.modelo,
    responsavelId: row.responsavel_id,
    responsavelNome: row.responsavel?.nome,
    mecanicoId: row.mecanico_id,
    mecanicoNome: row.mecanico?.nome,
    dataAbertura: row.data_abertura,
    dataEntrada: row.data_entrada,
    kmAtual: row.km_atual === null ? null : Number(row.km_atual),
    kmAnterior: row.km_anterior === null ? null : Number(row.km_anterior),
    status: row.status,
    defeitosRelatados: row.defeitos_relatados,
    observacoesInternas: row.observacoes_internas,
    valorProdutos: Number(row.valor_produtos ?? 0),
    valorServicos: Number(row.valor_servicos ?? 0),
    valorDesconto: Number(row.valor_desconto ?? 0),
    valorTotal: Number(row.valor_total ?? 0),
    criadoPor: row.criado_por,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapItem(row: any): OrdemServicoItem {
  return {
    id: row.id,
    ordemServicoId: row.ordem_servico_id,
    tipo: row.tipo,
    produtoId: row.produto_id,
    produtoNome: row.produtos?.nome,
    servicoId: row.servico_id,
    fornecedorId: row.fornecedor_id,
    fornecedorNome: row.fornecedores?.nome,
    numeroNota: row.numero_nota,
    descricao: row.descricao,
    quantidade: Number(row.quantidade),
    valorUnitario: Number(row.valor_unitario),
    valorCusto: row.valor_custo === null ? null : Number(row.valor_custo),
    valorDesconto: Number(row.valor_desconto ?? 0),
    valorTotal: Number(row.valor_total ?? 0),
    statusAprovacao: row.status_aprovacao,
    observacoes: row.observacoes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapHistorico(row: any): OrdemServicoHistoricoEntry {
  return {
    id: row.id,
    ordemServicoId: row.ordem_servico_id,
    funcionarioId: row.funcionario_id,
    funcionarioNome: row.funcionarios?.nome,
    acao: row.acao,
    detalhes: row.detalhes,
    ip: row.ip,
    createdAt: row.created_at,
  }
}

function itemParaRpc(item: ItemOrdemInput) {
  return {
    tipo: item.tipo,
    produtoId: item.produtoId ?? '',
    servicoId: item.servicoId ?? '',
    fornecedorId: item.fornecedorId ?? '',
    numeroNota: item.numeroNota ?? '',
    descricao: item.descricao,
    quantidade: item.quantidade,
    valorUnitario: item.valorUnitario,
    valorCusto: item.valorCusto ?? '',
    valorDesconto: item.valorDesconto ?? 0,
    observacoes: item.observacoes ?? '',
  }
}

function traduzirErro(mensagem: string): string {
  if (mensagem.includes('ESTOQUE_NEGATIVO')) return 'Essa operação deixaria o estoque de algum produto negativo.'
  if (mensagem.includes('ORDEM_JA_FINALIZADA')) return 'Esta ordem já foi finalizada/enviada ao caixa.'
  if (mensagem.includes('ORDEM_NAO_PODE_REABRIR')) return 'Só é possível reabrir uma ordem finalizada, enviada ao caixa ou paga.'
  if (mensagem.includes('NOTA_FISCAL_EMITIDA')) return 'Já existe nota fiscal emitida pra essa venda — cancele a nota fiscal antes de reabrir a OS.'
  if (mensagem.includes('ORDEM_SEM_ITENS')) return 'Adicione ao menos um produto ou serviço antes de finalizar.'
  if (mensagem.includes('ORDEM_NAO_ENCONTRADA')) return 'Ordem de serviço não encontrada.'
  if (mensagem.includes('ITEM_NAO_ENCONTRADO')) return 'Item não encontrado.'
  return mensagem
}

export async function listarOrdens(params: ListarOrdensParams = {}): Promise<ListarOrdensResult> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 20
  const search = params.search?.trim() ?? ''

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const numeroNota = params.numeroNota?.trim() ?? ''

  let query = supabase.from('ordens_servico').select(selectOrdemParaLista(Boolean(numeroNota)), { count: 'exact' })

  if (numeroNota) {
    query = query.ilike('ordem_servico_itens.numero_nota', `%${numeroNota.replace(/,/g, ' ')}%`)
  }

  if (params.status && params.status !== 'todas') {
    query = query.eq('status', params.status)
  }

  const numero = params.numero?.trim().replace(/\D/g, '') ?? ''
  if (numero) {
    query = query.ilike('numero::text', `%${numero}%`)
  }

  const clienteNome = params.clienteNome?.trim() ?? ''
  if (clienteNome) {
    query = query.ilike('clientes.nome', `%${clienteNome.replace(/,/g, ' ')}%`)
  }

  const veiculoModelo = params.veiculoModelo?.trim() ?? ''
  if (veiculoModelo) {
    query = query.ilike('veiculos.modelo', `%${veiculoModelo.replace(/,/g, ' ')}%`)
  }

  const placa = params.placa?.trim() ?? ''
  if (placa) {
    query = query.ilike('veiculos.placa', `%${placa.replace(/,/g, ' ')}%`)
  }

  const kmAtual = params.kmAtual?.trim().replace(/\D/g, '') ?? ''
  if (kmAtual) {
    query = query.ilike('km_atual::text', `%${kmAtual}%`)
  }

  if (search) {
    const termo = search.replace(/,/g, ' ')
    const condicoes = [
      `numero_prisma.ilike.%${termo}%`,
      `clientes.nome.ilike.%${termo}%`,
      `clientes.cpf_cnpj.ilike.%${termo}%`,
      `clientes.telefone.ilike.%${termo}%`,
      `veiculos.placa.ilike.%${termo}%`,
      `veiculos.modelo.ilike.%${termo}%`,
    ]
    if (/^\d+$/.test(termo.trim())) {
      condicoes.push(`numero.eq.${termo.trim()}`)
    }
    query = query.or(condicoes.join(','))
  }

  const coluna = COLUNA_POR_CAMPO[params.sortBy ?? 'numero']
  const ascendente = params.sortDirection === 'asc'

  const { data, count, error } = await query.order(coluna, { ascending: ascendente }).range(from, to)
  if (error) throw new Error(error.message)

  return {
    data: (data ?? []).map(mapOrdem),
    total: count ?? 0,
    page,
    pageSize,
  }
}

export async function buscarOrdemDetalhe(ordemServicoId: string): Promise<OrdemServicoDetalhe> {
  const [ordemResp, itensResp, historicoResp] = await Promise.all([
    supabase.from('ordens_servico').select(SELECT_ORDEM).eq('id', ordemServicoId).single(),
    supabase
      .from('ordem_servico_itens')
      .select('*, produtos(nome), fornecedores(nome)')
      .eq('ordem_servico_id', ordemServicoId)
      .order('created_at'),
    supabase
      .from('ordem_servico_historico')
      .select('*, funcionarios(nome)')
      .eq('ordem_servico_id', ordemServicoId)
      .order('created_at', { ascending: false }),
  ])

  if (ordemResp.error) throw new Error(ordemResp.error.message)
  if (itensResp.error) throw new Error(itensResp.error.message)
  if (historicoResp.error) throw new Error(historicoResp.error.message)

  return {
    ordem: mapOrdem(ordemResp.data),
    itens: (itensResp.data ?? []).map(mapItem),
    historico: (historicoResp.data ?? []).map(mapHistorico),
  }
}

export async function criarOrdemServico(
  input: CriarOrdemServicoInput,
  oficinaId: string,
  funcionarioId: string,
): Promise<{ id: string; numero: number }> {
  const ip = await capturarIpPublico()

  const { data, error } = await supabase.rpc('ordem_servico_criar', {
    p_oficina_id: oficinaId,
    p_cliente_id: input.clienteId,
    p_veiculo_id: input.veiculoId || null,
    p_responsavel_id: input.responsavelId,
    p_mecanico_id: input.mecanicoId || null,
    p_numero_prisma: input.numeroPrisma || null,
    p_data_abertura: input.dataAbertura,
    p_data_entrada: input.dataEntrada,
    p_km_atual: input.kmAtual ?? null,
    p_defeitos_relatados: input.defeitosRelatados || null,
    p_observacoes_internas: input.observacoesInternas || null,
    p_funcionario_id: funcionarioId,
    p_ip: ip,
    p_itens: input.itens.map(itemParaRpc),
  })

  if (error) throw new Error(traduzirErro(error.message))
  return { id: data.id, numero: Number(data.numero) }
}

export async function adicionarItemOrdem(
  ordemServicoId: string,
  funcionarioId: string,
  item: ItemOrdemInput,
): Promise<string> {
  const ip = await capturarIpPublico()
  const { data, error } = await supabase.rpc('ordem_servico_adicionar_item', {
    p_ordem_servico_id: ordemServicoId,
    p_funcionario_id: funcionarioId,
    p_ip: ip,
    p_item: itemParaRpc(item),
  })
  if (error) throw new Error(traduzirErro(error.message))
  return data as string
}

export async function atualizarItemOrdem(
  itemId: string,
  funcionarioId: string,
  alteracoes: Partial<ItemOrdemInput>,
): Promise<void> {
  const ip = await capturarIpPublico()
  const { error } = await supabase.rpc('ordem_servico_atualizar_item', {
    p_item_id: itemId,
    p_funcionario_id: funcionarioId,
    p_ip: ip,
    p_alteracoes: alteracoes,
  })
  if (error) throw new Error(traduzirErro(error.message))
}

export async function removerItemOrdem(itemId: string, funcionarioId: string): Promise<void> {
  const ip = await capturarIpPublico()
  const { error } = await supabase.rpc('ordem_servico_remover_item', {
    p_item_id: itemId,
    p_funcionario_id: funcionarioId,
    p_ip: ip,
  })
  if (error) throw new Error(traduzirErro(error.message))
}

export async function aprovarItemOrdem(
  itemId: string,
  statusAprovacao: 'aguardando' | 'aprovado' | 'recusado',
  funcionarioId: string,
): Promise<void> {
  const ip = await capturarIpPublico()
  const { error } = await supabase.rpc('ordem_servico_aprovar_item', {
    p_item_id: itemId,
    p_status_aprovacao: statusAprovacao,
    p_funcionario_id: funcionarioId,
    p_ip: ip,
  })
  if (error) throw new Error(traduzirErro(error.message))
}

export async function atualizarCabecalhoOrdem(
  ordemServicoId: string,
  funcionarioId: string,
  alteracoes: AtualizarCabecalhoInput,
): Promise<void> {
  const ip = await capturarIpPublico()
  const { error } = await supabase.rpc('ordem_servico_atualizar_cabecalho', {
    p_ordem_servico_id: ordemServicoId,
    p_funcionario_id: funcionarioId,
    p_ip: ip,
    p_alteracoes: alteracoes,
  })
  if (error) throw new Error(traduzirErro(error.message))
}

export async function finalizarOrdemServico(ordemServicoId: string, funcionarioId: string): Promise<void> {
  const ip = await capturarIpPublico()
  const { error } = await supabase.rpc('ordem_servico_finalizar', {
    p_ordem_servico_id: ordemServicoId,
    p_funcionario_id: funcionarioId,
    p_ip: ip,
  })
  if (error) throw new Error(traduzirErro(error.message))
}

export async function reabrirOrdemServico(ordemServicoId: string, funcionarioId: string): Promise<void> {
  const ip = await capturarIpPublico()
  const { error } = await supabase.rpc('ordem_servico_reabrir', {
    p_ordem_servico_id: ordemServicoId,
    p_funcionario_id: funcionarioId,
    p_ip: ip,
  })
  if (error) throw new Error(traduzirErro(error.message))
}

export async function cancelarOrdemServico(ordemServicoId: string, funcionarioId: string): Promise<void> {
  await atualizarCabecalhoOrdem(ordemServicoId, funcionarioId, { status: 'cancelada' })
}

export type SemaforoOrdem = 'verde' | 'amarelo' | 'vermelho'

// Calcula o "semáforo" de aprovação de cada OS visível na página atual sem
// carregar a lista inteira de itens: busca só ordem_servico_id + status_aprovacao
// das ordens exibidas e resume em memória.
export async function buscarSemaforoPorOrdens(ordemIds: string[]): Promise<Record<string, SemaforoOrdem>> {
  if (ordemIds.length === 0) return {}

  const { data, error } = await supabase
    .from('ordem_servico_itens')
    .select('ordem_servico_id, status_aprovacao')
    .in('ordem_servico_id', ordemIds)

  if (error) throw new Error(error.message)

  const resultado: Record<string, SemaforoOrdem> = {}
  for (const row of data ?? []) {
    const atual = resultado[row.ordem_servico_id]
    if (row.status_aprovacao === 'recusado') {
      resultado[row.ordem_servico_id] = 'vermelho'
    } else if (row.status_aprovacao === 'aguardando' && atual !== 'vermelho') {
      resultado[row.ordem_servico_id] = 'amarelo'
    } else if (!atual) {
      resultado[row.ordem_servico_id] = 'verde'
    }
  }
  return resultado
}
