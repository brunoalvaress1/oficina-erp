export interface DadosConsultaCpf {
  nome?: string
  dataNascimento?: string
  sexo?: string
}

/**
 * Ponto único de integração com um provedor de consulta de CPF (nome completo,
 * data de nascimento, etc). Nenhum provedor está configurado ainda — serviços desse
 * tipo (Receita Federal via convênio, Serpro, ou provedores privados como Assertiva,
 * Speedio) cobram por consulta/plano e exigem contrato/CNPJ homologado.
 *
 * Para ativar, defina VITE_CPF_API_URL (e VITE_CPF_API_KEY, se o provedor exigir) no
 * .env e ajuste o `fetch` e o mapeamento da resposta abaixo para o formato específico
 * do provedor escolhido.
 */
export async function consultarCpf(cpf: string): Promise<DadosConsultaCpf | null> {
  const apiUrl = import.meta.env.VITE_CPF_API_URL
  const apiKey = import.meta.env.VITE_CPF_API_KEY

  if (!apiUrl) {
    return null
  }

  const cpfLimpo = cpf.trim().replace(/\D/g, '')

  const response = await fetch(`${apiUrl}/${cpfLimpo}`, {
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
  })

  if (!response.ok) {
    throw new Error('Não foi possível consultar os dados do CPF informado')
  }

  const dados = await response.json()

  return {
    nome: dados.nome,
    dataNascimento: dados.dataNascimento,
    sexo: dados.sexo,
  }
}
