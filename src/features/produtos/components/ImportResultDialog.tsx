import type { ResultadoImportacaoProduto } from '../types/importacaoProduto'

interface ImportResultDialogProps {
  resultado: ResultadoImportacaoProduto
  onFechar: () => void
}

export function ImportResultDialog({ resultado, onFechar }: ImportResultDialogProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg border p-3">
          <p className="text-2xl font-semibold">{resultado.totalLinhas}</p>
          <p className="text-xs text-muted-foreground">Linhas no arquivo</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-2xl font-semibold text-emerald-600">{resultado.importados}</p>
          <p className="text-xs text-muted-foreground">Importados</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-2xl font-semibold text-destructive">{resultado.falhas}</p>
          <p className="text-xs text-muted-foreground">Não importados</p>
        </div>
      </div>

      {resultado.erros.length > 0 && (
        <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
          {resultado.erros.map((erro) => (
            <div key={erro.linha} className="px-3 py-2 text-sm">
              <span className="font-medium">Linha {erro.linha}:</span> {erro.mensagem}
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onFechar}
        className="w-full h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium"
      >
        Concluir
      </button>
    </div>
  )
}
