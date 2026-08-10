import type { ChangeEvent } from 'react'

// Campo de valor no padrão brasileiro: digita só números, a vírgula dos centavos
// e o ponto de milhar aparecem sozinhos (mesmo jeito de app de banco), sem precisar
// digitar "." pra separar decimal.
interface CampoMoedaProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

function formatarCentavos(digitos: string): string {
  const semZerosEsquerda = digitos.replace(/^0+(?=\d)/, '')
  const comZerosMinimos = semZerosEsquerda.padStart(3, '0')
  const parteInteira = comZerosMinimos.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  const parteCentavos = comZerosMinimos.slice(-2)
  return `${parteInteira},${parteCentavos}`
}

export function CampoMoeda({ value, onChange, onBlur, disabled, placeholder = '0,00', className }: CampoMoedaProps) {
  const centavosAtuais = value ? Math.round(Math.abs(Number(value)) * 100) : 0
  const textoExibido = value && centavosAtuais > 0 ? formatarCentavos(String(centavosAtuais)) : ''

  function handleChange(evento: ChangeEvent<HTMLInputElement>) {
    const digitos = evento.target.value.replace(/\D/g, '')
    const centavos = digitos ? parseInt(digitos, 10) : 0
    onChange(centavos ? (centavos / 100).toFixed(2) : '')
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      value={textoExibido}
      onChange={handleChange}
      onBlur={onBlur}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
    />
  )
}
