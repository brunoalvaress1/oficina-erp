import { useEffect, useRef, useState } from 'react'
import { Command } from 'cmdk'
import { Search, Plus, Loader2 } from 'lucide-react'
import { useDebouncedCallback } from 'use-debounce'

interface ComboboxProps<T> {
  value: T | null
  onSelect: (item: T) => void
  onSearch: (termo: string) => void
  items: T[]
  isLoading?: boolean
  getKey: (item: T) => string
  getLabel: (item: T) => string
  getDescription?: (item: T) => string | null | undefined
  placeholder?: string
  emptyMessage?: string
  onCriarNovo?: (termo: string) => void
  criarNovoLabel?: (termo: string) => string
  disabled?: boolean
}

export function Combobox<T>({
  value,
  onSelect,
  onSearch,
  items,
  isLoading,
  getKey,
  getLabel,
  getDescription,
  placeholder = 'Buscar...',
  emptyMessage = 'Nada encontrado',
  onCriarNovo,
  criarNovoLabel,
  disabled,
}: ComboboxProps<T>) {
  const [open, setOpen] = useState(false)
  const [termo, setTermo] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const buscarComDebounce = useDebouncedCallback((valor: string) => onSearch(valor), 250)

  useEffect(() => {
    function handleClickFora(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
  }, [])

  function handleChangeTermo(valor: string) {
    setTermo(valor)
    buscarComDebounce(valor)
    if (!open) setOpen(true)
  }

  function handleSelecionar(item: T) {
    onSelect(item)
    setTermo('')
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <Command shouldFilter={false} className="w-full">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Command.Input
            value={open ? termo : value ? getLabel(value) : termo}
            onValueChange={handleChangeTermo}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full h-9 rounded-md border bg-background pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
          />
        </div>

        {open && !disabled && (
          <Command.List className="absolute z-20 mt-1 w-full max-h-72 overflow-auto rounded-md border bg-background shadow-md">
            {isLoading && (
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                <Loader2 size={14} className="animate-spin" /> Buscando...
              </div>
            )}

            {!isLoading && items.length === 0 && (
              <Command.Empty className="px-3 py-2 text-sm text-muted-foreground">{emptyMessage}</Command.Empty>
            )}

            {!isLoading &&
              items.map((item) => (
                <Command.Item
                  key={getKey(item)}
                  value={getKey(item)}
                  onSelect={() => handleSelecionar(item)}
                  className="px-3 py-2 text-sm cursor-pointer aria-selected:bg-muted hover:bg-muted"
                >
                  <div className="font-medium">{getLabel(item)}</div>
                  {getDescription?.(item) && (
                    <div className="text-xs text-muted-foreground">{getDescription(item)}</div>
                  )}
                </Command.Item>
              ))}

            {onCriarNovo && termo.trim() && (
              <Command.Item
                value={`__criar__${termo}`}
                onSelect={() => {
                  onCriarNovo(termo.trim())
                  setOpen(false)
                }}
                className="px-3 py-2 text-sm cursor-pointer border-t text-primary flex items-center gap-2 aria-selected:bg-muted hover:bg-muted"
              >
                <Plus size={14} />
                {criarNovoLabel ? criarNovoLabel(termo.trim()) : `Criar "${termo.trim()}"`}
              </Command.Item>
            )}
          </Command.List>
        )}
      </Command>
    </div>
  )
}
