import { supabase } from '@/lib/supabase'
import { capitalizarPalavras } from '@/utils/format'
import type { Servico, ServicoInput } from '../types/servico'

function traduzirErro(mensagem: string): string {
  if (mensagem.includes('servicos_oficina_nome_normalizado_key') || mensagem.includes('duplicate key')) {
    return 'Já existe um serviço com esse nome.'
  }
  if (mensagem.includes('foreign key') || mensagem.includes('violates foreign key constraint')) {
    return 'Esse serviço já foi usado em alguma OS e não pode ser excluído — desative em vez de excluir.'
  }
  return mensagem
}

function mapRow(row: any): Servico {
  return {
    id: row.id,
    oficinaId: row.oficina_id,
    nome: row.nome,
    valorPadrao: Number(row.valor_padrao ?? 0),
    categoriaId: row.categoria_id,
    categoriaNome: row.categorias_servicos?.nome ?? null,
    tempoMedioMinutos: row.tempo_medio_minutos,
    descricao: row.descricao,
    ativo: row.ativo,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function buscarServicos(termo: string): Promise<Servico[]> {
  const texto = termo.trim()

  let query = supabase.from('servicos').select('*').eq('ativo', true).order('nome').limit(20)

  if (texto) {
    query = query.ilike('nome', `%${texto.replace(/,/g, ' ')}%`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapRow)
}

export async function listarServicosCompleto(oficinaId: string): Promise<Servico[]> {
  const { data, error } = await supabase
    .from('servicos')
    .select('*, categorias_servicos(nome)')
    .eq('oficina_id', oficinaId)
    .order('nome')
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapRow)
}

export async function criarServico(input: ServicoInput, oficinaId: string): Promise<Servico> {
  const nome = capitalizarPalavras(input.nome.trim())

  // Evita duplicata por maiúscula/minúscula/espaços (ex: "TROCA DE OLEO" x
  // "troca de oleo") reaproveitando o serviço já cadastrado em vez de criar
  // outro — reativa se ele estiver inativo, já que o índice único do banco
  // (oficina_id, nome normalizado) não distingue ativo de inativo.
  const { data: existente, error: erroExistente } = await supabase
    .from('servicos')
    .select('*, categorias_servicos(nome)')
    .eq('oficina_id', oficinaId)
    .ilike('nome', nome)
    .maybeSingle()
  if (erroExistente) throw new Error(traduzirErro(erroExistente.message))
  if (existente) {
    if (existente.ativo) return mapRow(existente)
    const { data: reativado, error: erroReativar } = await supabase
      .from('servicos')
      .update({ ativo: true, updated_at: new Date().toISOString() })
      .eq('id', existente.id)
      .select('*, categorias_servicos(nome)')
      .single()
    if (erroReativar) throw new Error(traduzirErro(erroReativar.message))
    return mapRow(reativado)
  }

  const { data, error } = await supabase
    .from('servicos')
    .insert({
      oficina_id: oficinaId,
      nome,
      valor_padrao: input.valorPadrao ?? 0,
      categoria_id: input.categoriaId || null,
      tempo_medio_minutos: input.tempoMedioMinutos || null,
      descricao: input.descricao || null,
    })
    .select('*')
    .single()

  if (error) throw new Error(traduzirErro(error.message))
  return mapRow(data)
}

export async function atualizarServico(id: string, input: Partial<ServicoInput>): Promise<Servico> {
  const colunas: Record<string, any> = {}
  if (input.nome !== undefined) colunas.nome = capitalizarPalavras(input.nome.trim())
  if (input.valorPadrao !== undefined) colunas.valor_padrao = input.valorPadrao
  if (input.categoriaId !== undefined) colunas.categoria_id = input.categoriaId || null
  if (input.tempoMedioMinutos !== undefined) colunas.tempo_medio_minutos = input.tempoMedioMinutos || null
  if (input.descricao !== undefined) colunas.descricao = input.descricao || null
  if (input.ativo !== undefined) colunas.ativo = input.ativo

  const { data, error } = await supabase.from('servicos').update(colunas).eq('id', id).select('*, categorias_servicos(nome)').single()
  if (error) throw new Error(traduzirErro(error.message))
  return mapRow(data)
}

export async function excluirServico(id: string): Promise<void> {
  const { error } = await supabase.from('servicos').delete().eq('id', id)
  if (error) throw new Error(traduzirErro(error.message))
}
