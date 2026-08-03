export interface EnderecoPorCep {
  endereco: string
  bairro: string
  cidade: string
  estado: string
  codigoCidade: string
}

export async function buscarEnderecoPorCep(cep: string): Promise<EnderecoPorCep | null> {
  const cepLimpo = cep.replace(/\D/g, '')
  if (cepLimpo.length !== 8) return null

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