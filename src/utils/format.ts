export function formatCpfCnpj(value: string): string {
  const digits = value.replace(/\D/g, '')

  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim()
  }
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim()
}

export function formatCep(value: string): string {
  const digits = value.replace(/\D/g, '')
  return digits.replace(/(\d{5})(\d{0,3})/, '$1-$2').trim()
}

export function formatDate(dateString: string): string {
  // Datas "puras" (coluna `date` do Postgres, ex: "2026-08-04", sem hora)
  // são interpretadas pelo Date() como meia-noite UTC — no fuso do Brasil
  // (negativo) isso "recua" um dia ao formatar no fuso local (uma OS paga
  // hoje aparecia com a data de ontem). Constrói a data direto a partir dos
  // componentes ano/mês/dia, já no fuso local, pra evitar isso. Timestamps
  // completos (com hora) continuam com a conversão de fuso normal.
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [ano, mes, dia] = dateString.split('-').map(Number)
    return new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR')
  }
  return new Date(dateString).toLocaleDateString('pt-BR')
}

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// Aceita tanto "1234.56" (input HTML number) quanto "1.234,56"/"R$ 1.234,56" (formato BR).
export function parseMoedaBr(valor: string): number {
  if (!valor) return 0
  const limpo = valor.replace(/[^0-9,.-]/g, '')
  const semSeparadorDeMilhar = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo
  const numero = Number.parseFloat(semSeparadorDeMilhar)
  return Number.isFinite(numero) ? numero : 0
}

export function formatPlaca(value: string): string {
  const clean = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
  // formato antigo com hífen visual (ABC-1234); Mercosul não recebe hífen
  const isMercosul = /^[A-Z]{3}\d[A-Z]/.test(clean)
  if (isMercosul || clean.length < 7) return clean
  return clean.replace(/^([A-Z]{3})(\d{4})$/, '$1-$2')
}