import { useState } from 'react'
import { Plus } from 'lucide-react'
import { formatDate } from '@/utils/format'
import { useChangelog, useCriarEntradaChangelog } from '../hooks/useChangelog'

export function Atualizacoes() {
  const { data: changelog, isLoading } = useChangelog()
  const criar = useCriarEntradaChangelog()

  const [mostrarForm, setMostrarForm] = useState(false)
  const [versao, setVersao] = useState('')
  const [descricao, setDescricao] = useState('')

  const versaoAtual = changelog?.[0]?.versao ?? '-'

  function handleCriar(event: React.FormEvent) {
    event.preventDefault()
    if (!versao.trim() || !descricao.trim()) return
    criar.mutate(
      { versao, descricao },
      {
        onSuccess: () => {
          setVersao('')
          setDescricao('')
          setMostrarForm(false)
        },
      },
    )
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Atualizações</h1>
          <p className="text-sm text-muted-foreground">Versão atual: <strong>{versaoAtual}</strong></p>
        </div>
        <button type="button" onClick={() => setMostrarForm((v) => !v)} className="flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium">
          <Plus size={15} /> Registrar novidade
        </button>
      </div>

      {mostrarForm && (
        <form onSubmit={handleCriar} className="border rounded-lg p-3 space-y-3 bg-muted/20">
          <div className="grid grid-cols-3 gap-3">
            <input
              value={versao}
              onChange={(e) => setVersao(e.target.value)}
              placeholder="Versão (ex: 1.1.0)"
              className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30"
            />
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="O que mudou..."
              rows={2}
              className="col-span-2 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <button type="submit" disabled={!versao.trim() || !descricao.trim() || criar.isPending} className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
            {criar.isPending ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {(changelog ?? []).map((entrada) => (
          <div key={entrada.id} className="rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">v{entrada.versao}</span>
              <span className="text-xs text-muted-foreground">{formatDate(entrada.data)}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{entrada.descricao}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
