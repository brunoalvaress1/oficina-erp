import { useState } from 'react'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { formatCurrency } from '@/utils/format'
import { PermissionGate } from '../components/PermissionGate'
import { useCatalogo } from '../hooks/useCatalogo'
import { useAtualizarServicoConfig, useCriarServicoConfig, useExcluirServicoConfig, useServicosConfig } from '../hooks/useServicosConfig'
import type { Servico, ServicoInput } from '@/features/ordens/types/servico'

const FORM_VAZIO: ServicoInput = { nome: '', valorPadrao: 0, categoriaId: null, tempoMedioMinutos: null, descricao: null }

export function Servicos() {
  const { data: servicos, isLoading } = useServicosConfig()
  const { data: categorias } = useCatalogo('categorias_servicos')
  const criar = useCriarServicoConfig()
  const atualizar = useAtualizarServicoConfig()
  const excluir = useExcluirServicoConfig()

  const [mostrarForm, setMostrarForm] = useState(false)
  const [novo, setNovo] = useState<ServicoInput>(FORM_VAZIO)

  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [edicao, setEdicao] = useState<ServicoInput>(FORM_VAZIO)

  function iniciarEdicao(servico: Servico) {
    setEditandoId(servico.id)
    setEdicao({
      nome: servico.nome,
      valorPadrao: servico.valorPadrao,
      categoriaId: servico.categoriaId,
      tempoMedioMinutos: servico.tempoMedioMinutos,
      descricao: servico.descricao,
    })
  }

  function handleCriar(event: React.FormEvent) {
    event.preventDefault()
    if (!novo.nome.trim()) return
    criar.mutate(novo, {
      onSuccess: () => {
        setNovo(FORM_VAZIO)
        setMostrarForm(false)
      },
    })
  }

  function salvarEdicao() {
    if (!editandoId || !edicao.nome.trim()) return
    atualizar.mutate({ id: editandoId, input: edicao }, { onSuccess: () => setEditandoId(null) })
  }

  function alternarAtivo(servico: Servico) {
    atualizar.mutate({ id: servico.id, input: { ativo: !servico.ativo } })
  }

  function handleExcluir(servico: Servico) {
    if (confirm(`Excluir o serviço "${servico.nome}"?`)) {
      excluir.mutate(servico.id)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Serviços</h1>
          <p className="text-sm text-muted-foreground">Catálogo completo de serviços, com categoria e tempo médio de execução.</p>
        </div>
        <button type="button" onClick={() => setMostrarForm((v) => !v)} className="flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium">
          <Plus size={15} /> Novo Serviço
        </button>
      </div>

      {mostrarForm && (
        <form onSubmit={handleCriar} className="border rounded-lg p-3 space-y-3 bg-muted/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1 col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Nome</label>
              <input
                value={novo.nome}
                onChange={(e) => setNovo((f) => ({ ...f, nome: e.target.value }))}
                className="w-full h-9 rounded-md border bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30"
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Valor Padrão</label>
              <input
                type="number"
                step="0.01"
                value={novo.valorPadrao ?? 0}
                onChange={(e) => setNovo((f) => ({ ...f, valorPadrao: Number(e.target.value) || 0 }))}
                className="w-full h-9 rounded-md border bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Tempo médio (min)</label>
              <input
                type="number"
                value={novo.tempoMedioMinutos ?? ''}
                onChange={(e) => setNovo((f) => ({ ...f, tempoMedioMinutos: e.target.value === '' ? null : Number(e.target.value) }))}
                className="w-full h-9 rounded-md border bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-1 col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Categoria</label>
              <select
                value={novo.categoriaId ?? ''}
                onChange={(e) => setNovo((f) => ({ ...f, categoriaId: e.target.value || null }))}
                className="w-full h-9 rounded-md border bg-background px-3 text-sm"
              >
                <option value="">Sem categoria</option>
                {(categorias ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1 col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Descrição</label>
              <input
                value={novo.descricao ?? ''}
                onChange={(e) => setNovo((f) => ({ ...f, descricao: e.target.value || null }))}
                className="w-full h-9 rounded-md border bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
          </div>
          <button type="submit" disabled={!novo.nome.trim() || criar.isPending} className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
            {criar.isPending ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
      )}

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-3 py-2">Nome</th>
              <th className="text-left font-medium px-3 py-2">Categoria</th>
              <th className="text-left font-medium px-3 py-2">Valor</th>
              <th className="text-left font-medium px-3 py-2">Tempo Médio</th>
              <th className="text-left font-medium px-3 py-2">Status</th>
              <th className="text-right font-medium px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">Carregando...</td>
              </tr>
            )}
            {!isLoading && (servicos ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">Nenhum serviço cadastrado</td>
              </tr>
            )}
            {(servicos ?? []).map((servico) => {
              const editando = editandoId === servico.id
              return (
                <tr key={servico.id} className="border-t">
                  {editando ? (
                    <>
                      <td className="px-3 py-2">
                        <input
                          value={edicao.nome}
                          onChange={(e) => setEdicao((f) => ({ ...f, nome: e.target.value }))}
                          className="h-8 w-full px-2 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={edicao.categoriaId ?? ''}
                          onChange={(e) => setEdicao((f) => ({ ...f, categoriaId: e.target.value || null }))}
                          className="h-8 rounded-md border bg-background px-2 text-sm"
                        >
                          <option value="">Sem categoria</option>
                          {(categorias ?? []).map((c) => (
                            <option key={c.id} value={c.id}>{c.nome}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          value={edicao.valorPadrao ?? 0}
                          onChange={(e) => setEdicao((f) => ({ ...f, valorPadrao: Number(e.target.value) || 0 }))}
                          className="h-8 w-24 px-2 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={edicao.tempoMedioMinutos ?? ''}
                          onChange={(e) => setEdicao((f) => ({ ...f, tempoMedioMinutos: e.target.value === '' ? null : Number(e.target.value) }))}
                          className="h-8 w-20 px-2 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{servico.ativo ? 'Ativo' : 'Inativo'}</td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-1">
                          <button type="button" onClick={salvarEdicao} title="Salvar" className="h-7 w-7 flex items-center justify-center rounded-md border text-green-700">
                            <Check size={13} />
                          </button>
                          <button type="button" onClick={() => setEditandoId(null)} title="Cancelar" className="h-7 w-7 flex items-center justify-center rounded-md border">
                            <X size={13} />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2 font-medium">{servico.nome}</td>
                      <td className="px-3 py-2 text-muted-foreground">{servico.categoriaNome ?? '-'}</td>
                      <td className="px-3 py-2">{formatCurrency(servico.valorPadrao)}</td>
                      <td className="px-3 py-2 text-muted-foreground">{servico.tempoMedioMinutos ? `${servico.tempoMedioMinutos} min` : '-'}</td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => alternarAtivo(servico)}
                          className={`text-xs px-2 py-0.5 rounded-full ${servico.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                        >
                          {servico.ativo ? 'Ativo' : 'Inativo'}
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-1">
                          <button type="button" onClick={() => iniciarEdicao(servico)} title="Editar" className="h-7 w-7 flex items-center justify-center rounded-md border">
                            <Pencil size={13} />
                          </button>
                          <PermissionGate codigo="configuracoes.visualizar">
                            <button
                              type="button"
                              onClick={() => handleExcluir(servico)}
                              title="Excluir"
                              className="h-7 w-7 flex items-center justify-center rounded-md border text-destructive"
                            >
                              <Trash2 size={13} />
                            </button>
                          </PermissionGate>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
