import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,      // mantém a sessão salva (localStorage)
    autoRefreshToken: true,    // renova o token automaticamente antes de expirar
    detectSessionInUrl: true,  // necessário para fluxos de magic link / OAuth
  },
})