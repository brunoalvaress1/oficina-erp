import { useState } from 'react'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { PermissionGate } from './PermissionGate'
import { useAtualizarItemCatalogo, useCatalogo, useCriarItemCatalogo, useExcluirItemCatalogo } from '../hooks/useCatalogo'
import type { ItemCatalogo, TabelaCatalogo } from '../types/catalogos'

interface CatalogoSimplesProps {
  tabela: TabelaCatalogo
  placeholder: string
}

export function CatalogoSimples({ tabela, placeholder }: CatalogoSimplesProps) {
  const { data: itens, isLoading } = useCatalogo(tabela)
  const criar = useCriarItemCatalogo(tabela)
  const atualizar = useAtualizarItemCatalogo(tabela)
  const excluir = useExcluirItemCatalogo(tabela)

  const [novoNome, setNovoNome] = useState('')
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [edicaoNome, setEdicaoNome] = useState('')

  function handleAdicionar(event: React.FormEvent) {
    event.preventDefault()
    const nome = novoNome.trim()
    if (!nome) return
    criar.mutate(nome, { onSuccess: () => setNovoNome('') })
  }

  function iniciarEdicao(item: ItemCatalogo) {
    setEditandoId(item.id)
    setEdicaoNome(item.nome)
  }

  function salvarEdicao(id: string) {
    const nome = edicaoNome.trim()
    if (!nome) return
    atualizar.mutate({ id, alteracoes: { nome } }, { onSuccess: () => setEditandoId(null) })
  }

  function handleExcluir(item: ItemCatalogo) {
    if (!confirm(`Excluir "${item.nome}"?`)) return
    excluir.mutate(item.id)
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <PermissionGate codigo="configuracoes.visualizar">
        <form onSubmit={handleAdicionar} className="p-3 border-b bg-muted/20 flex gap-2">
          <input
            type="text"
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            placeholder={placeholder}
            className="flex-1 h-9 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="submit"
            disabled={!novoNome.trim() || criar.isPending}
            className="flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
          >
            <Plus size={15} /> Adicionar
          </button>
        </form>
      </PermissionGate>

      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-muted-foreground">
          <tr>
            <th className="text-left font-medium px-3 py-2">Nome</th>
            <th className="text-left font-medium px-3 py-2">Status</th>
            <th className="text-right font-medium px-3 py-2">Ações</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr>
              <td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">
                Carregando...
              </td>
            </tr>
          )}
          {!isLoading && (itens ?? []).length === 0 && (
            <tr>
              <td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">
                Nenhum item cadastrado
              </td>
            </tr>
          )}
          {(itens ?? []).map((item) => {
            const editando = editandoId === item.id
            return (
              <tr key={item.id} className="border-t">
                <td className="px-3 py-2">
                  {editando ? (
                    <input
                      type="text"
                      value={edicaoNome}
                      onChange={(e) => setEdicaoNome(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && salvarEdicao(item.id)}
                      autoFocus
                      className="h-8 w-full px-2 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  ) : (
                    item.nome
                  )}
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => atualizar.mutate({ id: item.id, alteracoes: { ativo: !item.ativo } })}
                    className={`text-xs px-2 py-0.5 rounded-full ${item.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                  >
                    {item.ativo ? 'Ativo' : 'Inativo'}
                  </button>
                </td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-1">
                    {editando ? (
                      <>
                        <button type="button" onClick={() => salvarEdicao(item.id)} title="Salvar" className="h-7 w-7 flex items-center justify-center rounded-md border text-green-700">
                          <Check size={13} />
                        </button>
                        <button type="button" onClick={() => setEditandoId(null)} title="Cancelar" className="h-7 w-7 flex items-center justify-center rounded-md border">
                          <X size={13} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={() => iniciarEdicao(item)} title="Editar" className="h-7 w-7 flex items-center justify-center rounded-md border">
                          <Pencil size={13} />
                        </button>
                        <button type="button" onClick={() => handleExcluir(item)} title="Excluir" className="h-7 w-7 flex items-center justify-center rounded-md border text-destructive">
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
