import { supabase } from '@/lib/supabase'

export interface DadosConsultaCpf {
  nome?: string
  dataNascimento?: string
  sexo?: string
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
  if (mensagem.includes('CPF_INVALIDO')) return 'CPF em formato inválido.'
  if (mensagem.includes('HUB_DESENVOLVEDOR_TOKEN')) return 'Token da API de consulta de CPF inválido ou não configurado.'
  return mensagem
}

/**
 * Consulta nome completo e data de nascimento por CPF via Edge Function
 * `consultar-cpf`, que fala com a API da Hub do Desenvolvedor usando um
 * token guardado com segurança no servidor (nunca exposto ao navegador).
 */
export async function consultarCpf(cpf: string): Promise<DadosConsultaCpf | null> {
  const { data, error } = await supabase.functions.invoke('consultar-cpf', { body: { cpf } })
  if (error) {
    const mensagem = await extrairMensagemErro(error)
    // CPF válido mas não encontrado na base não é bem um "erro" pro usuário —
    // só não tem o que preencher automaticamente, o formulário continua normal.
    if (mensagem.includes('SEM_RESULTADOS')) return null
    throw new Error(traduzirErro(mensagem))
  }

  const dados = data?.dados
  if (!dados || (!dados.nome && !dados.dataNascimento)) return null

  return {
    nome: dados.nome ?? undefined,
    dataNascimento: dados.dataNascimento ?? undefined,
  }
}
