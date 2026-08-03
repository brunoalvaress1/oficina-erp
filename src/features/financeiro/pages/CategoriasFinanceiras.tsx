import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'
import { PermissionGate } from '../components/PermissionGate'
import {
  useAtualizarCategoriaFinanceira,
  useCategoriasFinanceirasLista,
  useCriarCategoriaFinanceira,
  useExcluirCategoriaFinanceira,
} from '../hooks/useCategoriasFinanceiras'
import { useAtualizarCentroCusto, useCentrosCustoLista, useCriarCentroCusto, useExcluirCentroCusto } from '../hooks/useCentrosCusto'
import type { CategoriaFinanceira, TipoCategoriaFinanceira } from '../types/categoriaFinanceira'
import type { CentroCusto } from '../types/centroCusto'

const ROTULO_TIPO: Record<TipoCategoriaFinanceira, string> = { receita: 'Receita', despesa: 'Despesa', ambos: 'Ambos' }

export function CategoriasFinanceiras() {
  const { funcionario } = usePermissions()
  const [aba, setAba] = useState<'categorias' | 'centros'>('categorias')

  const { data: categorias } = useCategoriasFinanceirasLista()
  const criarCategoria = useCriarCategoriaFinanceira()
  const atualizarCategoria = useAtualizarCategoriaFinanceira()
  const excluirCategoria = useExcluirCategoriaFinanceira()

  const { data: centros } = useCentrosCustoLista()
  const criarCentro = useCriarCentroCusto()
  const atualizarCentro = useAtualizarCentroCusto()
  const excluirCentro = useExcluirCentroCusto()

  const [novoNomeCategoria, setNovoNomeCategoria] = useState('')
  const [novoTipoCategoria, setNovoTipoCategoria] = useState<TipoCategoriaFinanceira>('ambos')
  const [novoNomeCentro, setNovoNomeCentro] = useState('')

  const [categoriaEditandoId, setCategoriaEditandoId] = useState<string | null>(null)
  const [edicaoNomeCategoria, setEdicaoNomeCategoria] = useState('')
  const [edicaoTipoCategoria, setEdicaoTipoCategoria] = useState<TipoCategoriaFinanceira>('ambos')

  const [centroEditandoId, setCentroEditandoId] = useState<string | null>(null)
  const [edicaoNomeCentro, setEdicaoNomeCentro] = useState('')

  function handleAdicionarCategoria(event: React.FormEvent) {
    event.preventDefault()
    const nome = novoNomeCategoria.trim()
    if (!nome) return
    if (!funcionario) {
      toast.error('Aguarde carregar seus dados antes de adicionar')
      return
    }
    criarCategoria.mutate({ nome, tipo: novoTipoCategoria }, { onSuccess: () => setNovoNomeCategoria('') })
  }

  function iniciarEdicaoCategoria(categoria: CategoriaFinanceira) {
    setCategoriaEditandoId(categoria.id)
    setEdicaoNomeCategoria(categoria.nome)
    setEdicaoTipoCategoria(categoria.tipo)
  }

  function salvarEdicaoCategoria(id: string) {
    const nome = edicaoNomeCategoria.trim()
    if (!nome) return
    atualizarCategoria.mutate({ id, alteracoes: { nome, tipo: edicaoTipoCategoria } }, { onSuccess: () => setCategoriaEditandoId(null) })
  }

  function handleExcluirCategoria(categoria: CategoriaFinanceira) {
    if (!confirm(`Excluir a categoria "${categoria.nome}"?`)) return
    excluirCategoria.mutate(categoria.id)
  }

  function handleAdicionarCentro(event: React.FormEvent) {
    event.preventDefault()
    const nome = novoNomeCentro.trim()
    if (!nome) return
    if (!funcionario) {
      toast.error('Aguarde carregar seus dados antes de adicionar')
      return
    }
    criarCentro.mutate(nome, { onSuccess: () => setNovoNomeCentro('') })
  }

  function iniciarEdicaoCentro(centro: CentroCusto) {
    setCentroEditandoId(centro.id)
    setEdicaoNomeCentro(centro.nome)
  }

  function salvarEdicaoCentro(id: string) {
    const nome = edicaoNomeCentro.trim()
    if (!nome) return
    atualizarCentro.mutate({ id, alteracoes: { nome } }, { onSuccess: () => setCentroEditandoId(null) })
  }

  function handleExcluirCentro(centro: CentroCusto) {
    if (!confirm(`Excluir o centro de custo "${centro.nome}"?`)) return
    excluirCentro.mutate(centro.id)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Categorias Financeiras</h1>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setAba('categorias')}
          className={`h-9 px-4 rounded-md text-sm font-medium border ${aba === 'categorias' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background'}`}
        >
          Categorias
        </button>
        <button
          type="button"
          onClick={() => setAba('centros')}
          className={`h-9 px-4 rounded-md text-sm font-medium border ${aba === 'centros' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background'}`}
        >
          Centro de Custo
        </button>
      </div>

      {aba === 'categorias' && (
        <div className="border rounded-lg overflow-hidden">
          <PermissionGate codigo="financeiro.lancar">
            <form onSubmit={handleAdicionarCategoria} className="p-3 border-b bg-muted/20 flex gap-2">
              <input
                type="text"
                value={novoNomeCategoria}
                onChange={(e) => setNovoNomeCategoria(e.target.value)}
                placeholder="Nome da categoria"
                className="flex-1 h-9 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
              <select
                value={novoTipoCategoria}
                onChange={(e) => setNovoTipoCategoria(e.target.value as TipoCategoriaFinanceira)}
                className="h-9 rounded-md border bg-background px-2 text-sm"
              >
                <option value="ambos">Ambos</option>
                <option value="receita">Receita</option>
                <option value="despesa">Despesa</option>
              </select>
              <button
                type="submit"
                disabled={!novoNomeCategoria.trim() || criarCategoria.isPending}
                className="flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
              >
                <Plus size={15} /> {criarCategoria.isPending ? 'Adicionando...' : 'Adicionar'}
              </button>
            </form>
          </PermissionGate>

          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-3 py-2">Nome</th>
                <th className="text-left font-medium px-3 py-2">Tipo</th>
                <th className="text-left font-medium px-3 py-2">Status</th>
                <th className="text-right font-medium px-3 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {(categorias ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                    Nenhuma categoria cadastrada
                  </td>
                </tr>
              )}
              {(categorias ?? []).map((categoria) => {
                const editando = categoriaEditandoId === categoria.id
                return (
                  <tr key={categoria.id} className="border-t">
                    <td className="px-3 py-2">
                      {editando ? (
                        <input
                          type="text"
                          value={edicaoNomeCategoria}
                          onChange={(e) => setEdicaoNomeCategoria(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && salvarEdicaoCategoria(categoria.id)}
                          autoFocus
                          className="h-8 w-full px-2 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      ) : (
                        categoria.nome
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {editando ? (
                        <select
                          value={edicaoTipoCategoria}
                          onChange={(e) => setEdicaoTipoCategoria(e.target.value as TipoCategoriaFinanceira)}
                          className="h-8 rounded-md border bg-background px-2 text-sm"
                        >
                          <option value="ambos">Ambos</option>
                          <option value="receita">Receita</option>
                          <option value="despesa">Despesa</option>
                        </select>
                      ) : (
                        ROTULO_TIPO[categoria.tipo]
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <PermissionGate
                        codigo="financeiro.editar"
                        fallback={<span className="text-xs">{categoria.ativo ? 'Ativa' : 'Inativa'}</span>}
                      >
                        <button
                          type="button"
                          onClick={() => atualizarCategoria.mutate({ id: categoria.id, alteracoes: { ativo: !categoria.ativo } })}
                          className={`text-xs px-2 py-0.5 rounded-full ${categoria.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                        >
                          {categoria.ativo ? 'Ativa' : 'Inativa'}
                        </button>
                      </PermissionGate>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-1">
                        {editando ? (
                          <>
                            <button
                              type="button"
                              onClick={() => salvarEdicaoCategoria(categoria.id)}
                              title="Salvar"
                              className="h-7 w-7 flex items-center justify-center rounded-md border text-green-700"
                            >
                              <Check size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setCategoriaEditandoId(null)}
                              title="Cancelar"
                              className="h-7 w-7 flex items-center justify-center rounded-md border"
                            >
                              <X size={13} />
                            </button>
                          </>
                        ) : (
                          <>
                            <PermissionGate codigo="financeiro.editar">
                              <button
                                type="button"
                                onClick={() => iniciarEdicaoCategoria(categoria)}
                                title="Editar"
                                className="h-7 w-7 flex items-center justify-center rounded-md border"
                              >
                                <Pencil size={13} />
                              </button>
                            </PermissionGate>
                            <PermissionGate codigo="financeiro.excluir">
                              <button
                                type="button"
                                onClick={() => handleExcluirCategoria(categoria)}
                                title="Excluir"
                                className="h-7 w-7 flex items-center justify-center rounded-md border text-destructive"
                              >
                                <Trash2 size={13} />
                              </button>
                            </PermissionGate>
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
      )}

      {aba === 'centros' && (
        <div className="border rounded-lg overflow-hidden">
          <PermissionGate codigo="financeiro.lancar">
            <form onSubmit={handleAdicionarCentro} className="p-3 border-b bg-muted/20 flex gap-2">
              <input
                type="text"
                value={novoNomeCentro}
                onChange={(e) => setNovoNomeCentro(e.target.value)}
                placeholder="Nome do centro de custo"
                className="flex-1 h-9 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="submit"
                disabled={!novoNomeCentro.trim() || criarCentro.isPending}
                className="flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
              >
                <Plus size={15} /> {criarCentro.isPending ? 'Adicionando...' : 'Adicionar'}
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
              {(centros ?? []).length === 0 && (
                <tr>
                  <td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">
                    Nenhum centro de custo cadastrado
                  </td>
                </tr>
              )}
              {(centros ?? []).map((centro) => {
                const editando = centroEditandoId === centro.id
                return (
                  <tr key={centro.id} className="border-t">
                    <td className="px-3 py-2">
                      {editando ? (
                        <input
                          type="text"
                          value={edicaoNomeCentro}
                          onChange={(e) => setEdicaoNomeCentro(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && salvarEdicaoCentro(centro.id)}
                          autoFocus
                          className="h-8 w-full px-2 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      ) : (
                        centro.nome
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <PermissionGate codigo="financeiro.editar" fallback={<span className="text-xs">{centro.ativo ? 'Ativo' : 'Inativo'}</span>}>
                        <button
                          type="button"
                          onClick={() => atualizarCentro.mutate({ id: centro.id, alteracoes: { ativo: !centro.ativo } })}
                          className={`text-xs px-2 py-0.5 rounded-full ${centro.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                        >
                          {centro.ativo ? 'Ativo' : 'Inativo'}
                        </button>
                      </PermissionGate>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-1">
                        {editando ? (
                          <>
                            <button
                              type="button"
                              onClick={() => salvarEdicaoCentro(centro.id)}
                              title="Salvar"
                              className="h-7 w-7 flex items-center justify-center rounded-md border text-green-700"
                            >
                              <Check size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setCentroEditandoId(null)}
                              title="Cancelar"
                              className="h-7 w-7 flex items-center justify-center rounded-md border"
                            >
                              <X size={13} />
                            </button>
                          </>
                        ) : (
                          <>
                            <PermissionGate codigo="financeiro.editar">
                              <button
                                type="button"
                                onClick={() => iniciarEdicaoCentro(centro)}
                                title="Editar"
                                className="h-7 w-7 flex items-center justify-center rounded-md border"
                              >
                                <Pencil size={13} />
                              </button>
                            </PermissionGate>
                            <PermissionGate codigo="financeiro.excluir">
                              <button
                                type="button"
                                onClick={() => handleExcluirCentro(centro)}
                                title="Excluir"
                                className="h-7 w-7 flex items-center justify-center rounded-md border text-destructive"
                              >
                                <Trash2 size={13} />
                              </button>
                            </PermissionGate>
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
      )}
    </div>
  )
}
