import { supabase } from '@/lib/supabase'

export interface DadosConsultaPlaca {
  marca?: string
  modelo?: string
  cor?: string
  ano?: string
  anoModelo?: string
  chassi?: string
  motor?: string
  combustivel?: string
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
  if (mensagem.includes('PLACA_INVALIDA')) return 'Placa em formato inválido.'
  if (mensagem.includes('TOKEN_INVALIDO')) return 'Token da API Placas inválido ou expirado — verifique a configuração.'
  if (mensagem.includes('LIMITE_ATINGIDO')) return 'Limite diário de consultas da API Placas foi atingido.'
  return mensagem
}

/**
 * Consulta veicular por placa via Edge Function `consultar-placa`, que fala
 * com a API Placas (apiplacas.com.br) usando um token guardado com segurança
 * no servidor (nunca exposto ao navegador).
 */
export async function consultarPlaca(placa: string): Promise<DadosConsultaPlaca | null> {
  const { data, error } = await supabase.functions.invoke('consultar-placa', { body: { placa } })
  if (error) {
    const mensagem = await extrairMensagemErro(error)
    // Placa não encontrada na base não é bem um "erro" pro usuário — só não
    // tem o que preencher automaticamente, o formulário continua normal.
    if (mensagem.includes('SEM_RESULTADOS')) return null
    throw new Error(traduzirErro(mensagem))
  }
  return data?.dados ?? null
}
