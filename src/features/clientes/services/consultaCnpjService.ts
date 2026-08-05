import { supabase } from '@/lib/supabase'

export interface DadosConsultaCnpj {
  nome?: string
  telefone?: string
  email?: string
  cep?: string
  endereco?: string
  numero?: string
  bairro?: string
  cidade?: string
  estado?: string
}

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

function traduzirErro(mensagem: string): string {
  if (mensagem.includes('CNPJ_INVALIDO')) return 'CNPJ em formato inválido.'
  if (mensagem.includes('HUB_DESENVOLVEDOR_TOKEN')) return 'Token da API de consulta de CNPJ inválido ou não configurado.'
  return mensagem
}

/**
 * Consulta razão social e endereço por CNPJ via Edge Function
 * `consultar-cnpj`, que fala com a API da Hub do Desenvolvedor usando um
 * token guardado com segurança no servidor (nunca exposto ao navegador).
 */
export async function consultarCnpj(cnpj: string): Promise<DadosConsultaCnpj | null> {
  const { data, error } = await supabase.functions.invoke('consultar-cnpj', { body: { cnpj } })
  if (error) {
    const mensagem = await extrairMensagemErro(error)
    // CNPJ válido mas não encontrado na base não é bem um "erro" pro usuário —
    // só não tem o que preencher automaticamente, o formulário continua normal.
    if (mensagem.includes('SEM_RESULTADOS')) return null
    throw new Error(traduzirErro(mensagem))
  }

  const dados = data?.dados
  if (!dados || !dados.nome) return null

  return dados
}
