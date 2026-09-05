import { supabase } from '@/lib/supabase'
import type { CriarOficinaInput, OficinaAdmin, StatusAssinatura } from '../types/oficinaAdmin'

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

export async function souSuperAdmin(): Promise<boolean> {
  const { data } = await supabase.from('super_admins').select('id').maybeSingle()
  return !!data
}

export async function listarOficinasAdmin(): Promise<OficinaAdmin[]> {
  const { data, error } = await supabase.functions.invoke('admin-listar-oficinas')
  if (error) throw new Error(await extrairMensagemErro(error))
  return data.oficinas
}

export async function criarOficinaAdmin(input: CriarOficinaInput): Promise<void> {
  const { error } = await supabase.functions.invoke('admin-criar-oficina', { body: input })
  if (error) throw new Error(await extrairMensagemErro(error))
}

export async function atualizarStatusOficinaAdmin(oficinaId: string, statusAssinatura: StatusAssinatura, motivo?: string): Promise<void> {
  const { error } = await supabase.functions.invoke('admin-atualizar-status-oficina', { body: { oficinaId, statusAssinatura, motivo } })
  if (error) throw new Error(await extrairMensagemErro(error))
}

export async function atualizarVencimentoOficinaAdmin(oficinaId: string, vencimentoMensalidade: string | null): Promise<void> {
  const { error } = await supabase.functions.invoke('admin-atualizar-status-oficina', { body: { oficinaId, vencimentoMensalidade } })
  if (error) throw new Error(await extrairMensagemErro(error))
}

export async function atualizarValorMensalidadeOficinaAdmin(oficinaId: string, valorMensalidade: number | null): Promise<void> {
  const { error } = await supabase.functions.invoke('admin-atualizar-status-oficina', { body: { oficinaId, valorMensalidade } })
  if (error) throw new Error(await extrairMensagemErro(error))
}

// Chave PIX de cobrança da plataforma — diferente das ações acima, essa
// escreve direto na tabela (protegida por RLS pra só super admin) em vez de
// passar por uma edge function: é só um texto de configuração, não uma ação
// sensível que precise de auditoria/efeito colateral em outra tabela.
export async function atualizarChavePixPlataforma(chavePix: string): Promise<void> {
  const { error } = await supabase.from('configuracoes_plataforma').update({ chave_pix: chavePix || null }).eq('id', 'global')
  if (error) throw new Error(error.message)
}
