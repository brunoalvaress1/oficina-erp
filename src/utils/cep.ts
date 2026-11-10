import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

export interface EnderecoPorCep {
  endereco: string
  bairro: string
  cidade: string
  estado: string
  codigoCidade: string
}

// Kill switch do super admin (Admin → Oficinas). A busca de CEP é feita
// direto do navegador (viacep), sem passar por Edge Function — por isso a
// checagem acontece aqui antes do fetch, em vez de num servidor.
async function funcionalidadeDesativada(codigo: string): Promise<string | null> {
  const { data } = await supabase.from('configuracoes_plataforma').select('funcionalidades').eq('id', 'global').maybeSingle()
  const config = (data?.funcionalidades as Record<string, { ativo?: boolean; mensagem?: string }> | null)?.[codigo]
  if (config && config.ativo === false) return config.mensagem || 'Função temporariamente indisponível. Fale com o suporte.'
  return null
}

export async function buscarEnderecoPorCep(cep: string): Promise<EnderecoPorCep | null> {
  const cepLimpo = cep.replace(/\D/g, '')
  if (cepLimpo.length !== 8) return null

  const mensagemDesativada = await funcionalidadeDesativada('puxar_cep')
  if (mensagemDesativada) {
    toast.error(mensagemDesativada)
    return null
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
    const data = await response.json()

    if (data.erro) return null

    return {
      endereco: data.logradouro,
      bairro: data.bairro,
      cidade: data.localidade,
      estado: data.uf,
      codigoCidade: data.ibge,
    }
  } catch {
    return null
  }
}