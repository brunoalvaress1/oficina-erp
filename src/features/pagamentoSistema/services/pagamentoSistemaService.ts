import { supabase } from '@/lib/supabase'
import type { ConfigPlataforma, InfoPagamentoSistema } from '../types/pagamentoSistema'

// RLS de `oficinas` deixa o funcionário ler a própria oficina mesmo quando
// bloqueada (mesma regra usada em ProtectedRoute pra mostrar a tela de
// bloqueio) — por isso dá pra buscar isso sem select explícito de oficina_id,
// o Supabase já filtra pra "a oficina desse funcionário" via RLS.
export async function buscarInfoPagamentoSistema(): Promise<InfoPagamentoSistema | null> {
  const { data, error } = await supabase
    .from('oficinas')
    .select('nome_fantasia, vencimento_mensalidade, valor_mensalidade, status_assinatura, bloqueada_motivo')
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  return {
    nomeFantasia: data.nome_fantasia,
    vencimentoMensalidade: data.vencimento_mensalidade,
    valorMensalidade: data.valor_mensalidade === null ? null : Number(data.valor_mensalidade),
    statusAssinatura: data.status_assinatura,
    bloqueadaMotivo: data.bloqueada_motivo,
  }
}

// Chave PIX/mensagem de cobrança, configuráveis pelo super admin — lida por
// qualquer oficina (RLS libera leitura pra todo autenticado, mesmo bloqueado).
export async function buscarConfigPlataforma(): Promise<ConfigPlataforma | null> {
  const { data, error } = await supabase
    .from('configuracoes_plataforma')
    .select('chave_pix, mensagem_urgencia')
    .eq('id', 'global')
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  return { chavePix: data.chave_pix, mensagemUrgencia: data.mensagem_urgencia }
}
