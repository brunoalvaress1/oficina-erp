import { supabase } from '@/lib/supabase'
import { registrarAuditoriaConfiguracao } from './auditoriaConfigService'
import type { DadosOficina, DadosOficinaInput } from '../types/oficina'

function mapRow(row: any): DadosOficina {
  return {
    id: row.id,
    nomeFantasia: row.nome_fantasia,
    razaoSocial: row.razao_social,
    cnpj: row.cnpj,
    inscricaoEstadual: row.inscricao_estadual,
    regimeTributario: row.regime_tributario,
    telefone: row.telefone,
    whatsapp: row.whatsapp,
    email: row.email,
    cep: row.cep,
    endereco: row.endereco,
    numero: row.numero,
    bairro: row.bairro,
    cidade: row.cidade,
    estado: row.estado,
    codigoMunicipio: row.codigo_municipio,
    logoUrl: row.logo_url,
    site: row.site,
    instagram: row.instagram,
    facebook: row.facebook,
    horarioFuncionamento: row.horario_funcionamento,
    observacoes: row.observacoes,
    nomeImpressao: row.nome_impressao,
    rodapeImpressao: row.rodape_impressao,
    mensagemAgradecimento: row.mensagem_agradecimento,
    mensagemOs: row.mensagem_os,
    mensagemWhatsappPadrao: row.mensagem_whatsapp_padrao,
  }
}

export async function buscarDadosOficina(oficinaId: string): Promise<DadosOficina> {
  const { data, error } = await supabase.from('oficinas').select('*').eq('id', oficinaId).single()
  if (error) throw new Error(error.message)
  return mapRow(data)
}

export async function atualizarDadosOficina(
  oficinaId: string,
  input: Partial<DadosOficinaInput>,
  funcionarioId: string,
): Promise<DadosOficina> {
  const colunas: Record<string, any> = {}
  if (input.nomeFantasia !== undefined) colunas.nome_fantasia = input.nomeFantasia || null
  if (input.razaoSocial !== undefined) colunas.razao_social = input.razaoSocial || null
  if (input.cnpj !== undefined) colunas.cnpj = input.cnpj || null
  if (input.inscricaoEstadual !== undefined) colunas.inscricao_estadual = input.inscricaoEstadual || null
  if (input.regimeTributario !== undefined) colunas.regime_tributario = input.regimeTributario || null
  if (input.telefone !== undefined) colunas.telefone = input.telefone || null
  if (input.whatsapp !== undefined) colunas.whatsapp = input.whatsapp || null
  if (input.email !== undefined) colunas.email = input.email || null
  if (input.cep !== undefined) colunas.cep = input.cep || null
  if (input.endereco !== undefined) colunas.endereco = input.endereco || null
  if (input.numero !== undefined) colunas.numero = input.numero || null
  if (input.bairro !== undefined) colunas.bairro = input.bairro || null
  if (input.cidade !== undefined) colunas.cidade = input.cidade || null
  if (input.estado !== undefined) colunas.estado = input.estado || null
  if (input.codigoMunicipio !== undefined) colunas.codigo_municipio = input.codigoMunicipio || null
  if (input.logoUrl !== undefined) colunas.logo_url = input.logoUrl || null
  if (input.site !== undefined) colunas.site = input.site || null
  if (input.instagram !== undefined) colunas.instagram = input.instagram || null
  if (input.facebook !== undefined) colunas.facebook = input.facebook || null
  if (input.horarioFuncionamento !== undefined) colunas.horario_funcionamento = input.horarioFuncionamento || null
  if (input.observacoes !== undefined) colunas.observacoes = input.observacoes || null
  if (input.nomeImpressao !== undefined) colunas.nome_impressao = input.nomeImpressao || null
  if (input.rodapeImpressao !== undefined) colunas.rodape_impressao = input.rodapeImpressao || null
  if (input.mensagemAgradecimento !== undefined) colunas.mensagem_agradecimento = input.mensagemAgradecimento || null
  if (input.mensagemOs !== undefined) colunas.mensagem_os = input.mensagemOs || null
  if (input.mensagemWhatsappPadrao !== undefined) colunas.mensagem_whatsapp_padrao = input.mensagemWhatsappPadrao || null

  const { data, error } = await supabase.from('oficinas').update(colunas).eq('id', oficinaId).select('*').single()
  if (error) throw new Error(error.message)

  await registrarAuditoriaConfiguracao('dados_oficina', oficinaId, funcionarioId, 'atualizado', colunas)

  return mapRow(data)
}

export async function enviarLogoOficina(oficinaId: string, arquivo: File): Promise<string> {
  const extensao = arquivo.name.split('.').pop()
  const caminho = `${oficinaId}/logo.${extensao}`

  const { error } = await supabase.storage.from('logos-oficina').upload(caminho, arquivo, { upsert: true })
  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from('logos-oficina').getPublicUrl(caminho)
  return `${data.publicUrl}?t=${Date.now()}`
}
