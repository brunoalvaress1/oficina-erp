import { useEffect, useRef, useState } from 'react'
import { Download, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { exportarCsv, exportarExcel, imprimirTabela, type ColunaExport } from '../services/exportService'
import { PermissionGate } from './PermissionGate'

interface ExportMenuProps<T> {
  linhas: T[]
  colunas: ColunaExport<T>[]
  nomeBase: string
  titulo: string
}

export function ExportMenu<T>({ linhas, colunas, nomeBase, titulo }: ExportMenuProps<T>) {
  const [aberto, setAberto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickFora(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
  }, [])

  async function handleExcel() {
    try {
      await exportarExcel(linhas, colunas, nomeBase)
    } catch (error) {
      toast.error('Erro ao exportar Excel', { description: error instanceof Error ? error.message : String(error) })
    }
    setAberto(false)
  }

  async function handlePdf() {
    try {
      const { gerarEBaixarPdfGenerico } = await import('./DocumentoGenericoPdf')
      await gerarEBaixarPdfGenerico(titulo, colunas, linhas, `${nomeBase}.pdf`)
    } catch (error) {
      toast.error('Erro ao exportar PDF', { description: error instanceof Error ? error.message : String(error) })
    }
    setAberto(false)
  }

  return (
    <PermissionGate codigo="financeiro.exportar">
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          className="flex items-center gap-2 h-9 px-3 rounded-md border text-sm font-medium"
        >
          <Download size={15} /> Exportar <ChevronDown size={14} />
        </button>

        {aberto && (
          <div className="absolute right-0 mt-1 w-44 rounded-md border bg-background shadow-lg z-30 py-1 text-sm">
            <button
              type="button"
              onClick={() => {
                exportarCsv(linhas, colunas, nomeBase)
                setAberto(false)
              }}
              className="w-full text-left px-3 py-2 hover:bg-muted"
            >
              CSV
            </button>
            <button type="button" onClick={handleExcel} className="w-full text-left px-3 py-2 hover:bg-muted">
              Excel
            </button>
            <button type="button" onClick={handlePdf} className="w-full text-left px-3 py-2 hover:bg-muted">
              PDF
            </button>
            <button
              type="button"
              onClick={() => {
                imprimirTabela(linhas, colunas, titulo)
                setAberto(false)
              }}
              className="w-full text-left px-3 py-2 hover:bg-muted"
            >
              Imprimir
            </button>
          </div>
        )}
      </div>
    </PermissionGate>
  )
}
