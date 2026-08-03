import { supabase } from '@/lib/supabase'
import type {
  HistoricoNotaFiscalEntry,
  ListarNotasFiscaisParams,
  ListarNotasFiscaisResult,
  NotaFiscalSaida,
  OrdemPagaParaEmitir,
} from '../types/notaFiscalSaida'

function mapRow(row: any): NotaFiscalSaida {
  return {
    id: row.id,
    oficinaId: row.oficina_id,
    caixaLancamentoId: row.caixa_lancamento_id,
    ordemServicoId: row.ordem_servico_id,
    ordemNumero: row.ordens_servico?.numero ?? null,
    tipo: row.tipo,
    ambiente: row.ambiente,
    status: row.status,
    referencia: row.referencia,
    numero: row.numero,
    serie: row.serie,
    chaveAcesso: row.chave_acesso,
    protocoloAutorizacao: row.protocolo_autorizacao,
    urlDanfe: row.url_danfe,
    urlXml: row.url_xml,
    qrcodeUrl: row.qrcode_url,
    mensagemErro: row.mensagem_erro,
    valorTotal: Number(row.valor_total ?? 0),
    clienteNome: row.cliente_nome,
    criadoPorNome: row.funcionarios?.nome ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listarNotasFiscais(params: ListarNotasFiscaisParams = {}): Promise<ListarNotasFiscaisResult> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('notas_fiscais_saida')
    .select('*, ordens_servico(numero), funcionarios(nome)', { count: 'exact' })

  if (params.status) query = query.eq('status', params.status)

  const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to)
  if (error) throw new Error(error.message)

  return { data: (data ?? []).map(mapRow), total: count ?? 0, page, pageSize }
}

// Peça (NFC-e/NF-e) e serviço (NFS-e) são documentos independentes — um
// mesmo lançamento pode ter uma nota válida de cada tipo ao mesmo tempo, por
// isso isso retorna uma lista (não dá mais pra usar .maybeSingle() aqui).
export async function listarNotasFiscaisPorLancamento(caixaLancamentoId: string): Promise<NotaFiscalSaida[]> {
  const { data, error } = await supabase
    .from('notas_fiscais_saida')
    .select('*, ordens_servico(numero), funcionarios(nome)')
    .eq('caixa_lancamento_id', caixaLancamentoId)
    .not('status', 'in', '(cancelada,erro,rejeitada)')
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapRow)
}

// OS com status "paga" que ainda não têm nenhuma nota emitida (ou em
// processamento) — usado na aba "OS pagas p/ emitir" da tela de Notas Fiscais,
// pra não depender só do menu de cada OS/lançamento individualmente.
//
// Importante: `caixa_lancamentos.ordem_servico_id` não tem constraint unique,
// então o PostgREST sempre embute `caixa_lancamentos(id)` como ARRAY aqui
// (mesmo só existindo 1 lançamento por OS na prática) — pegamos o primeiro.
function extrairIdLancamento(caixaLancamentos: unknown): string | null {
  if (Array.isArray(caixaLancamentos)) return caixaLancamentos[0]?.id ?? null
  return (caixaLancamentos as any)?.id ?? null
}

export async function listarOrdensPagasParaEmitir(): Promise<OrdemPagaParaEmitir[]> {
  const { data: ordens, error: erroOrdens } = await supabase
    .from('ordens_servico')
    .select('id, numero, valor_total, clientes(nome), caixa_lancamentos(id), ordem_servico_itens(tipo)')
    .eq('status', 'paga')
    .order('numero', { ascending: false })
  if (erroOrdens) throw new Error(erroOrdens.message)

  const ordensComLancamento = (ordens ?? []).map((o: any) => {
    const itens: { tipo: string }[] = o.ordem_servico_itens ?? []
    return {
      ...o,
      caixaLancamentoId: extrairIdLancamento(o.caixa_lancamentos),
      temPeca: itens.some((i) => i.tipo === 'produto_estoque' || i.tipo === 'produto_terceirizado'),
      temServico: itens.some((i) => i.tipo === 'servico'),
    }
  })

  const caixaLancamentoIds = ordensComLancamento.map((o) => o.caixaLancamentoId).filter((id): id is string => !!id)
  if (caixaLancamentoIds.length === 0) return []

  // Peça (NFC-e/NF-e) e serviço (NFS-e) são documentos independentes — uma OS
  // só sai dessa lista quando TODOS os tipos que ela realmente tem itens já
  // tiverem nota válida emitida.
  const { data: notasExistentes, error: erroNotas } = await supabase
    .from('notas_fiscais_saida')
    .select('caixa_lancamento_id, tipo')
    .in('caixa_lancamento_id', caixaLancamentoIds)
    .not('status', 'in', '(cancelada,erro,rejeitada)')
  if (erroNotas) throw new Error(erroNotas.message)

  const pecaEmitidaPorLancamento = new Set(
    (notasExistentes ?? []).filter((n) => n.tipo === 'nfce' || n.tipo === 'nfe').map((n) => n.caixa_lancamento_id),
  )
  const servicoEmitidoPorLancamento = new Set(
    (notasExistentes ?? []).filter((n) => n.tipo === 'nfse').map((n) => n.caixa_lancamento_id),
  )

  return ordensComLancamento
    .filter((o) => {
      if (!o.caixaLancamentoId) return false
      const pecaPendente = o.temPeca && !pecaEmitidaPorLancamento.has(o.caixaLancamentoId)
      const servicoPendente = o.temServico && !servicoEmitidoPorLancamento.has(o.caixaLancamentoId)
      return pecaPendente || servicoPendente
    })
    .map((o) => ({
      ordemServicoId: o.id,
      ordemNumero: o.numero,
      clienteNome: o.clientes?.nome ?? null,
      valorTotal: Number(o.valor_total ?? 0),
      caixaLancamentoId: o.caixaLancamentoId!,
    }))
}

export async function listarHistoricoNotaFiscal(notaFiscalId: string): Promise<HistoricoNotaFiscalEntry[]> {
  const { data, error } = await supabase
    .from('notas_fiscais_saida_historico')
    .select('*')
    .eq('nota_fiscal_id', notaFiscalId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map((row: any) => ({
    id: row.id,
    notaFiscalId: row.nota_fiscal_id,
    statusAnterior: row.status_anterior,
    statusNovo: row.status_novo,
    mensagem: row.mensagem,
    createdAt: row.created_at,
  }))
}

function traduzirErroFunction(mensagem: string): string {
  if (mensagem.includes('LANCAMENTO_NAO_RECEBIDO')) return 'Essa OS ainda não teve o pagamento recebido no Caixa.'
  if (mensagem.includes('NOTA_JA_EMITIDA')) return 'Já existe uma nota fiscal emitida (ou em processamento) para essa venda.'
  if (mensagem.includes('SEM_ITENS_DE_PECA')) return 'Essa OS não tem nenhum item de peça — não há o que emitir.'
  if (mensagem.includes('SEM_ITENS_DE_SERVICO')) return 'Essa OS não tem nenhum item de serviço (mão de obra) — não há o que emitir em NFS-e.'
  if (mensagem.includes('ITENS_SEM_IMPOSTO_CONFIGURADO')) return mensagem.replace('ITENS_SEM_IMPOSTO_CONFIGURADO: ', 'Produtos sem imposto configurado: ')
  if (mensagem.includes('CLIENTE_SEM_CADASTRO_COMPLETO')) return 'O cliente precisa ter CPF/CNPJ, endereço e cidade completos no cadastro antes de emitir a nota.'
  if (mensagem.includes('OFICINA_SEM_CNPJ_CONFIGURADO')) return 'Configure o CNPJ da oficina em Configurações > Dados da Oficina antes de emitir.'
  if (mensagem.includes('OFICINA_SEM_CODIGO_MUNICIPIO')) return 'Configure o Código do Município (IBGE) em Configurações > Dados da Oficina antes de emitir NFS-e.'
  if (mensagem.includes('NFE_NAO_CONFIGURADA')) return 'Ative a integração de Nota Fiscal em Configurações > Nota Fiscal antes de emitir.'
  if (mensagem.includes('SEM_PERMISSAO')) return 'Você não tem permissão para emitir notas fiscais.'
  if (mensagem.includes('JUSTIFICATIVA_OBRIGATORIA')) return 'Informe uma justificativa com pelo menos 15 caracteres para cancelar.'
  if (mensagem.includes('SO_E_POSSIVEL_CANCELAR_NOTA_AUTORIZADA')) return 'Só é possível cancelar uma nota que já foi autorizada.'
  return mensagem
}

// A Edge Function sempre responde com um corpo JSON ({ error } ou { nota }),
// mas o client do Supabase, quando o status HTTP não é 2xx, joga o corpo pra
// dentro de `error.context` (Response) em vez de `data` — por isso extraímos
// a mensagem de lá antes de cair no `error.message` genérico.
async function extrairMensagemErro(error: unknown): Promise<string> {
  const contexto = (error as any)?.context
  if (contexto && typeof contexto.json === 'function') {
    try {
      const corpo = await contexto.json()
      if (corpo?.error) return corpo.error
    } catch {
      // corpo não era JSON, cai no fallback abaixo
    }
  }
  return error instanceof Error ? error.message : String(error)
}

export async function emitirNotaFiscal(caixaLancamentoId: string, tipo: 'nfce' | 'nfe' = 'nfce'): Promise<NotaFiscalSaida> {
  const { data, error } = await supabase.functions.invoke('emitir-nota-fiscal', { body: { caixaLancamentoId, tipo } })
  if (error) throw new Error(traduzirErroFunction(await extrairMensagemErro(error)))
  return mapRow(data.nota)
}

export async function emitirNfse(caixaLancamentoId: string): Promise<NotaFiscalSaida> {
  const { data, error } = await supabase.functions.invoke('emitir-nfse', { body: { caixaLancamentoId } })
  if (error) throw new Error(traduzirErroFunction(await extrairMensagemErro(error)))
  return mapRow(data.nota)
}

export async function consultarStatusNotaFiscal(notaFiscalId: string): Promise<NotaFiscalSaida> {
  const { data, error } = await supabase.functions.invoke('consultar-nota-fiscal', { body: { notaFiscalId } })
  if (error) throw new Error(traduzirErroFunction(await extrairMensagemErro(error)))
  return mapRow(data.nota)
}

export async function cancelarNotaFiscal(notaFiscalId: string, justificativa: string): Promise<NotaFiscalSaida> {
  const { data, error } = await supabase.functions.invoke('cancelar-nota-fiscal', { body: { notaFiscalId, justificativa } })
  if (error) throw new Error(traduzirErroFunction(await extrairMensagemErro(error)))
  return mapRow(data.nota)
}
