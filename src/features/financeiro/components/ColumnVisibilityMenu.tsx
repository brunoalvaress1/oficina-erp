import { useEffect, useRef, useState } from 'react'
import { Columns3, ChevronDown } from 'lucide-react'

interface ColumnVisibilityMenuProps {
  colunas: { chave: string; titulo: string }[]
  visiveis: Record<string, boolean>
  onAlternar: (chave: string) => void
}

export function ColumnVisibilityMenu({ colunas, visiveis, onAlternar }: ColumnVisibilityMenuProps) {
  const [aberto, setAberto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickFora(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setAberto((v) => !v)} className="flex items-center gap-2 h-9 px-3 rounded-md border text-sm font-medium">
        <Columns3 size={15} /> Colunas <ChevronDown size={14} />
      </button>

      {aberto && (
        <div className="absolute right-0 mt-1 w-52 rounded-md border bg-background shadow-lg z-30 py-1 text-sm max-h-72 overflow-auto">
          {colunas.map((coluna) => (
            <label key={coluna.chave} className="flex items-center gap-2 px-3 py-2 hover:bg-muted cursor-pointer">
              <input type="checkbox" checked={visiveis[coluna.chave] !== false} onChange={() => onAlternar(coluna.chave)} />
              {coluna.titulo}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
