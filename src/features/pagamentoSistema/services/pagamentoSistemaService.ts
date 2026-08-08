import { supabase } from '@/lib/supabase'
import type { InfoPagamentoSistema } from '../types/pagamentoSistema'

// RLS de `oficinas` deixa o funcionário ler a própria oficina mesmo quando
// bloqueada (mesma regra usada em ProtectedRoute pra mostrar a tela de
// bloqueio) — por isso dá pra buscar isso sem select explícito de oficina_id,
// o Supabase já filtra pra "a oficina desse funcionário" via RLS.
export async function buscarInfoPagamentoSistema(): Promise<InfoPagamentoSistema | null> {
  const { data, error } = await supabase
    .from('oficinas')
    .select('nome_fantasia, vencimento_mensalidade, status_assinatura, bloqueada_motivo')
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  return {
    nomeFantasia: data.nome_fantasia,
    vencimentoMensalidade: data.vencimento_mensalidade,
    statusAssinatura: data.status_assinatura,
    bloqueadaMotivo: data.bloqueada_motivo,
  }
}
