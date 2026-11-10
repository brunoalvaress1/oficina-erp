import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Kill switch por oficina, controlado pelo super admin em Admin → Oficinas.
// Se a funcionalidade estiver desativada PRA ESSA oficina, nem chega a
// chamar a API externa — a mensagem lançada aqui é a que o super admin
// escolheu pra aparecer pra ela.
export async function verificarFuncionalidadeAtiva(admin: SupabaseClient, oficinaId: string, codigo: string): Promise<void> {
  const { data } = await admin.from('oficinas').select('funcionalidades').eq('id', oficinaId).maybeSingle()

  const config = (data?.funcionalidades as Record<string, { ativo?: boolean; mensagem?: string }> | null)?.[codigo]
  if (config && config.ativo === false) {
    throw new Error(`FUNCIONALIDADE_DESATIVADA: ${config.mensagem || 'Função temporariamente indisponível. Fale com o suporte.'}`)
  }
}
