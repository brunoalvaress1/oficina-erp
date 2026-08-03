import { useState } from 'react'
import { ChevronsLeft, ChevronsRight } from 'lucide-react'

interface PaginationProps {
  page: number
  pageSize: number
  totalItems: number
  itemsMostrados: number
  itemLabel: string
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  pageSizeOptions?: number[]
}

export function Pagination({
  page,
  pageSize,
  totalItems,
  itemsMostrados,
  itemLabel,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [20, 30, 50, 100],
}: PaginationProps) {
  const totalPaginas = Math.max(1, Math.ceil(totalItems / pageSize))
  const [paginaDigitada, setPaginaDigitada] = useState('')

  function irParaPagina(valor: number) {
    onPageChange(Math.min(totalPaginas, Math.max(1, valor)))
  }

  function handleSubmitPagina(event: React.FormEvent) {
    event.preventDefault()
    const valor = Number(paginaDigitada)
    if (Number.isFinite(valor) && valor > 0) {
      irParaPagina(valor)
    }
    setPaginaDigitada('')
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
      <div className="text-sm text-muted-foreground">
        Mostrando {itemsMostrados} de {totalItems} {itemLabel}
      </div>

      <div className="flex items-center gap-2">
        <select
          value={pageSize}
          onChange={(event) => {
            onPageSizeChange(Number(event.target.value))
          }}
          className="h-9 rounded-md border bg-background px-2 text-sm"
        >
          {pageSizeOptions.map((opcao) => (
            <option key={opcao} value={opcao}>
              {opcao} por página
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => irParaPagina(1)}
          disabled={page === 1}
          title="Primeira página"
          className="h-9 w-9 flex items-center justify-center rounded-md border text-sm disabled:opacity-50"
        >
          <ChevronsLeft size={15} />
        </button>

        <button
          type="button"
          onClick={() => irParaPagina(page - 1)}
          disabled={page === 1}
          className="h-9 px-3 rounded-md border text-sm disabled:opacity-50"
        >
          Anterior
        </button>

        <span className="text-sm px-1 whitespace-nowrap">
          Página {page} de {totalPaginas}
        </span>

        <button
          type="button"
          onClick={() => irParaPagina(page + 1)}
          disabled={page >= totalPaginas}
          className="h-9 px-3 rounded-md border text-sm disabled:opacity-50"
        >
          Próxima
        </button>

        <button
          type="button"
          onClick={() => irParaPagina(totalPaginas)}
          disabled={page >= totalPaginas}
          title="Última página"
          className="h-9 w-9 flex items-center justify-center rounded-md border text-sm disabled:opacity-50"
        >
          <ChevronsRight size={15} />
        </button>

        <form onSubmit={handleSubmitPagina} className="flex items-center gap-1">
          <input
            type="number"
            min={1}
            max={totalPaginas}
            value={paginaDigitada}
            onChange={(event) => setPaginaDigitada(event.target.value)}
            placeholder="Ir para..."
            className="h-9 w-20 rounded-md border bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </form>
      </div>
    </div>
  )
}
