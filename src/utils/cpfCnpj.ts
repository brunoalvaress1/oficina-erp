// Validação matemática dos dígitos verificadores (mesmo algoritmo que a
// Sefaz usa) — sem isso, um CPF/CNPJ digitado errado só é descoberto na hora
// de emitir a nota fiscal, quando a Sefaz rejeita ("CPF do destinatário
// inválido"), bem depois do cadastro do cliente já ter sido salvo.

export function validarCpf(valor: string): boolean {
  const cpf = valor.replace(/\D/g, '')
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false

  const digitos = cpf.split('').map(Number)
  const calcularDigito = (fatorInicial: number) => {
    const soma = digitos.slice(0, fatorInicial - 1).reduce((acc, digito, indice) => acc + digito * (fatorInicial - indice), 0)
    const resto = soma % 11
    return resto < 2 ? 0 : 11 - resto
  }

  return calcularDigito(10) === digitos[9] && calcularDigito(11) === digitos[10]
}

export function validarCnpj(valor: string): boolean {
  const cnpj = valor.replace(/\D/g, '')
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false

  const digitos = cnpj.split('').map(Number)
  const calcularDigito = (pesos: number[]) => {
    const soma = pesos.reduce((acc, peso, indice) => acc + peso * digitos[indice], 0)
    const resto = soma % 11
    return resto < 2 ? 0 : 11 - resto
  }

  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

  return calcularDigito(pesos1) === digitos[12] && calcularDigito(pesos2) === digitos[13]
}

// Aceita string vazia (documento é opcional em vários fluxos) — só valida o
// dígito verificador quando algo foi de fato digitado.
export function cpfCnpjValidoOuVazio(valor: string): boolean {
  const digitos = valor.replace(/\D/g, '')
  if (!digitos) return true
  if (digitos.length === 11) return validarCpf(digitos)
  if (digitos.length === 14) return validarCnpj(digitos)
  return false
}
