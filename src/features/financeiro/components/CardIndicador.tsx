import type { ReactNode } from 'react'

interface CardIndicadorProps {
  titulo: string
  valor: string
  icone?: ReactNode
  destaque?: 'positivo' | 'negativo' | 'neutro'
  subtitulo?: string
}

const CORES_DESTAQUE: Record<NonNullable<CardIndicadorProps['destaque']>, string> = {
  positivo: 'text-emerald-600',
  negativo: 'text-red-600',
  neutro: '',
}

export function CardIndicador({ titulo, valor, icone, destaque = 'neutro', subtitulo }: CardIndicadorProps) {
  return (
    <div className="rounded-lg border p-4 space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{titulo}</span>
        {icone && <span className="text-muted-foreground">{icone}</span>}
      </div>
      <p className={`text-xl font-semibold ${CORES_DESTAQUE[destaque]}`}>{valor}</p>
      {subtitulo && <p className="text-xs text-muted-foreground">{subtitulo}</p>}
    </div>
  )
}
