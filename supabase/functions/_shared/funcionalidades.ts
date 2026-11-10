import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Kill switch global (todas as oficinas) controlado pelo super admin em
// Admin → Oficinas. Se a funcionalidade estiver desativada, nem chega a
// chamar a API externa — a mensagem lançada aqui é a que o super admin
// escolheu pra aparecer pra oficina.
export async function verificarFuncionalidadeAtiva(admin: SupabaseClient, codigo: string): Promise<void> {
  const { data } = await admin.from('configuracoes_plataforma').select('funcionalidades').eq('id', 'global').maybeSingle()

  const config = (data?.funcionalidades as Record<string, { ativo?: boolean; mensagem?: string }> | null)?.[codigo]
  if (config && config.ativo === false) {
    throw new Error(`FUNCIONALIDADE_DESATIVADA: ${config.mensagem || 'Função temporariamente indisponível. Fale com o suporte.'}`)
  }
}
