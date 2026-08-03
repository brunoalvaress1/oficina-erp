import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Instância separada da principal (`src/lib/supabase.ts`), sem persistir sessão.
// Usada só para criar login de novos funcionários via `auth.signUp()` — se
// usássemos o client principal, a sessão de quem está cadastrando seria trocada
// pela do usuário recém-criado.
export const supabaseAuxiliar = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
})
