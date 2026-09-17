import { useState } from 'react'
import { ChevronDown, SlidersHorizontal } from 'lucide-react'

interface ColunaOpcao {
  chave: string
  label: string
}

interface ColunasDropdownProps {
  opcoes: ColunaOpcao[]
  visivel: Record<string, boolean>
  onAlternar: (chave: string) => void
}

// Botão "Colunas" com um painel de checkboxes pra escolher o que aparece na
// tabela — usado nas telas de lista (Produtos, Clientes, ...) que têm mais
// colunas disponíveis do que cabe confortável na tela de uma vez.
export function ColunasDropdown({ opcoes, visivel, onAlternar }: ColunasDropdownProps) {
  const [aberto, setAberto] = useState(false)

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-md border text-sm font-medium transition-colors ${
          aberto ? 'bg-muted' : 'bg-background hover:bg-muted'
        }`}
      >
        <SlidersHorizontal size={14} /> Colunas
        <ChevronDown size={14} className={`transition-transform ${aberto ? 'rotate-180' : ''}`} />
      </button>

      {aberto && (
        <>
          {/* Fecha ao clicar fora, sem precisar de lib de detecção de clique externo */}
          <button type="button" aria-hidden className="fixed inset-0 z-10 cursor-default" onClick={() => setAberto(false)} tabIndex={-1} />
          <div className="absolute right-0 mt-1.5 w-60 rounded-lg border bg-card shadow-lg p-1.5 z-20 text-sm">
            <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Colunas visíveis</p>
            {opcoes.map((opcao) => (
              <label key={opcao.chave} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={visivel[opcao.chave] ?? false}
                  onChange={() => onAlternar(opcao.chave)}
                  className="size-3.5"
                />
                {opcao.label}
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
