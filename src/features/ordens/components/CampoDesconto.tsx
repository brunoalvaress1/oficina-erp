import { useState } from 'react'
import { CampoMoeda } from '@/components/ui/CampoMoeda'

interface CampoDescontoProps {
  // quantidade × valor unitário do item — base pro cálculo do desconto em %.
  valorBase: number
  // valorDesconto do item, sempre em R$ (é o que é salvo no banco) — o toggle
  // % aqui é só uma forma alternativa de PREENCHER esse mesmo valor.
  value: string
  onChange: (valorDesconto: string) => void
  disabled?: boolean
  compacto?: boolean
  // false quando o campo já está dentro de uma coluna de tabela com o
  // cabeçalho "Desconto" — evita repetir o rótulo.
  mostrarLabel?: boolean
}

export function CampoDesconto({ valorBase, value, onChange, disabled, compacto, mostrarLabel = true }: CampoDescontoProps) {
  const [tipo, setTipo] = useState<'valor' | 'percentual'>('valor')
  const [percentualInput, setPercentualInput] = useState('')

  function handleTrocarTipo(novoTipo: 'valor' | 'percentual') {
    setTipo(novoTipo)
    if (novoTipo !== 'percentual') return
    // Ao trocar pra %, tenta mostrar o percentual equivalente do valor atual,
    // em vez de começar do zero e perder o desconto já preenchido.
    const atual = Number(value) || 0
    setPercentualInput(valorBase > 0 && atual > 0 ? String(Math.round((atual / valorBase) * 10000) / 100) : '')
  }

  function handlePercentualChange(pct: string) {
    setPercentualInput(pct)
    const percentual = Number(pct) || 0
    const valorCalculado = valorBase > 0 ? Math.round(valorBase * percentual) / 100 : 0
    onChange(valorCalculado > 0 ? valorCalculado.toFixed(2) : '')
  }

  const alturaInput = compacto ? 'h-8' : 'h-9'

  return (
    <div className="space-y-1">
      <div className={`flex items-center gap-2 ${mostrarLabel ? 'justify-between' : 'justify-end'}`}>
        {mostrarLabel && <label className="text-sm font-medium">Desconto</label>}
        <div className="flex rounded border overflow-hidden text-[10px] leading-none shrink-0">
          <button
            type="button"
            onClick={() => handleTrocarTipo('valor')}
            disabled={disabled}
            className={`px-1.5 py-1 font-medium ${tipo === 'valor' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground'}`}
          >
            R$
          </button>
          <button
            type="button"
            onClick={() => handleTrocarTipo('percentual')}
            disabled={disabled}
            className={`px-1.5 py-1 font-medium border-l ${tipo === 'percentual' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground'}`}
          >
            %
          </button>
        </div>
      </div>
      {tipo === 'valor' ? (
        <CampoMoeda
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`w-full ${alturaInput} rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50`}
        />
      ) : (
        <input
          type="number"
          min={0}
          max={100}
          step="0.01"
          value={percentualInput}
          onChange={(e) => handlePercentualChange(e.target.value)}
          disabled={disabled}
          placeholder="0"
          className={`w-full ${alturaInput} rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50`}
        />
      )}
    </div>
  )
}
