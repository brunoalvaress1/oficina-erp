import { useMemo, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import type { PermissaoCatalogo } from '../types/permissaoCatalogo'

interface PermissoesChecklistProps {
  catalogo: PermissaoCatalogo[]
  selecionados: Set<string>
  onChange: (selecionados: Set<string>) => void
}

// Checklist de permissões agrupado por categoria, com grupos colapsáveis,
// "marcar todas" (geral e por grupo) e busca — usado tanto pra dar permissão
// direto a um funcionário quanto pra montar um Perfil (pacote de permissões).
export function PermissoesChecklist({ catalogo, selecionados, onChange }: PermissoesChecklistProps) {
  const [busca, setBusca] = useState('')
  const [gruposFechados, setGruposFechados] = useState<Set<string>>(new Set())

  const termoBusca = busca.trim().toLowerCase()
  const catalogoFiltrado = termoBusca
    ? catalogo.filter((p) => p.descricao.toLowerCase().includes(termoBusca) || p.categoria.toLowerCase().includes(termoBusca))
    : catalogo

  const categorias = useMemo(
    () => Array.from(new Set(catalogoFiltrado.map((p) => p.categoria))).sort(),
    [catalogoFiltrado],
  )

  function alternarCodigo(codigo: string) {
    const novo = new Set(selecionados)
    if (novo.has(codigo)) novo.delete(codigo)
    else novo.add(codigo)
    onChange(novo)
  }

  function alternarGrupo(codigosDoGrupo: string[], marcar: boolean) {
    const novo = new Set(selecionados)
    for (const codigo of codigosDoGrupo) {
      if (marcar) novo.add(codigo)
      else novo.delete(codigo)
    }
    onChange(novo)
  }

  function alternarTodas(marcar: boolean) {
    onChange(marcar ? new Set(catalogo.map((p) => p.codigo)) : new Set())
  }

  function alternarAberto(categoria: string) {
    setGruposFechados((atual) => {
      const novo = new Set(atual)
      if (novo.has(categoria)) novo.delete(categoria)
      else novo.add(categoria)
      return novo
    })
  }

  const totalSelecionadas = catalogo.filter((p) => selecionados.has(p.codigo)).length

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar permissão..."
            className="w-full h-8 rounded-md border bg-background pl-7 pr-2 text-xs outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {totalSelecionadas}/{catalogo.length} selecionadas
        </span>
        <button type="button" onClick={() => alternarTodas(true)} className="h-8 px-2 rounded-md border text-xs font-medium shrink-0">
          Marcar todas
        </button>
        <button type="button" onClick={() => alternarTodas(false)} className="h-8 px-2 rounded-md border text-xs font-medium shrink-0">
          Limpar
        </button>
      </div>

      <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
        {categorias.map((categoria) => {
          const permissoesDoGrupo = catalogoFiltrado.filter((p) => p.categoria === categoria)
          const codigosDoGrupo = permissoesDoGrupo.map((p) => p.codigo)
          const marcadosNoGrupo = codigosDoGrupo.filter((c) => selecionados.has(c)).length
          const todasMarcadas = marcadosNoGrupo === codigosDoGrupo.length && codigosDoGrupo.length > 0
          const aberto = !gruposFechados.has(categoria)

          return (
            <div key={categoria}>
              <button
                type="button"
                onClick={() => alternarAberto(categoria)}
                className="w-full flex items-center justify-between px-3 py-2 bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={todasMarcadas}
                    ref={(el) => {
                      if (el) el.indeterminate = marcadosNoGrupo > 0 && !todasMarcadas
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => alternarGrupo(codigosDoGrupo, e.target.checked)}
                  />
                  <span className="text-xs font-semibold uppercase text-muted-foreground">{categoria}</span>
                  <span className="text-xs text-muted-foreground">
                    ({marcadosNoGrupo}/{codigosDoGrupo.length})
                  </span>
                </div>
                <ChevronDown size={14} className={`text-muted-foreground transition-transform ${aberto ? 'rotate-180' : ''}`} />
              </button>
              {aberto && (
                <div className="px-3 py-2 space-y-1.5">
                  {permissoesDoGrupo.map((permissao) => (
                    <label key={permissao.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={selecionados.has(permissao.codigo)} onChange={() => alternarCodigo(permissao.codigo)} />
                      {permissao.descricao}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        {categorias.length === 0 && <p className="px-3 py-6 text-center text-sm text-muted-foreground">Nenhuma permissão encontrada</p>}
      </div>
    </div>
  )
}
