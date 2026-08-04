import type { ReactNode } from 'react'

interface CardIndicadorProps {
  titulo: string
  valor: string
  icone?: ReactNode
  destaque?: 'positivo' | 'negativo' | 'neutro'
  subtitulo?: string
}

const CORES_DESTAQUE: Record<NonNullable<CardIndicadorProps['destaque']>, string> = {
  positivo: 'text-emerald-600 dark:text-emerald-400',
  negativo: 'text-red-600 dark:text-red-400',
  neutro: 'text-foreground',
}

const CORES_ICONE: Record<NonNullable<CardIndicadorProps['destaque']>, string> = {
  positivo: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  negativo: 'bg-red-500/10 text-red-600 dark:text-red-400',
  neutro: 'bg-primary/10 text-primary',
}

export function CardIndicador({ titulo, valor, icone, destaque = 'neutro', subtitulo }: CardIndicadorProps) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-2 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{titulo}</span>
        {icone && (
          <span className={`flex items-center justify-center size-7 rounded-md ${CORES_ICONE[destaque]}`}>{icone}</span>
        )}
      </div>
      <p className={`text-xl font-semibold ${CORES_DESTAQUE[destaque]}`}>{valor}</p>
      {subtitulo && <p className="text-xs text-muted-foreground">{subtitulo}</p>}
    </div>
  )
}
