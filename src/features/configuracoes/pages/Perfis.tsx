import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { usePermissoesCatalogo } from '@/features/funcionarios/hooks/usePermissoesCatalogo'
import { useAtualizarPerfil, useCriarPerfil, useExcluirPerfil, usePerfis } from '../hooks/usePerfis'
import type { PerfilPermissao } from '../types/permissaoPerfil'

export function Perfis() {
  const { data: perfis, isLoading } = usePerfis()
  const { data: catalogo } = usePermissoesCatalogo()
  const criar = useCriarPerfil()
  const atualizar = useAtualizarPerfil()
  const excluir = useExcluirPerfil()

  const [modalAberto, setModalAberto] = useState(false)
  const [perfilEditando, setPerfilEditando] = useState<PerfilPermissao | null>(null)
  const [nome, setNome] = useState('')
  const [codigosSelecionados, setCodigosSelecionados] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!modalAberto) return
    setNome(perfilEditando?.nome ?? '')
    setCodigosSelecionados(new Set(perfilEditando?.codigos ?? []))
  }, [modalAberto, perfilEditando])

  function handleNovo() {
    setPerfilEditando(null)
    setModalAberto(true)
  }

  function handleEditar(perfil: PerfilPermissao) {
    setPerfilEditando(perfil)
    setModalAberto(true)
  }

  function alternarCodigo(codigo: string) {
    setCodigosSelecionados((atual) => {
      const novo = new Set(atual)
      if (novo.has(codigo)) novo.delete(codigo)
      else novo.add(codigo)
      return novo
    })
  }

  function handleSalvar() {
    const input = { nome, codigos: Array.from(codigosSelecionados) }
    if (perfilEditando) {
      atualizar.mutate({ id: perfilEditando.id, input }, { onSuccess: () => setModalAberto(false) })
    } else {
      criar.mutate(input, { onSuccess: () => setModalAberto(false) })
    }
  }

  function handleExcluir(perfil: PerfilPermissao) {
    if (!confirm(`Excluir o perfil "${perfil.nome}"?`)) return
    excluir.mutate(perfil.id)
  }

  const categorias = Array.from(new Set((catalogo ?? []).map((p) => p.categoria))).sort()
  const salvando = criar.isPending || atualizar.isPending

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Perfis de Permissão</h1>
          <p className="text-sm text-muted-foreground">Um perfil é um pacote de permissões pra aplicar de uma vez em um funcionário — depois ainda dá pra ajustar individualmente.</p>
        </div>
        <button type="button" onClick={handleNovo} className="flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium">
          <Plus size={15} /> Novo Perfil
        </button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-3 py-2">Nome</th>
              <th className="text-left font-medium px-3 py-2">Permissões</th>
              <th className="text-right font-medium px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">Carregando...</td>
              </tr>
            )}
            {!isLoading && (perfis ?? []).length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">Nenhum perfil cadastrado</td>
              </tr>
            )}
            {(perfis ?? []).map((perfil) => (
              <tr key={perfil.id} className="border-t">
                <td className="px-3 py-2 font-medium">{perfil.nome}</td>
                <td className="px-3 py-2 text-muted-foreground">{perfil.codigos.length} permissões</td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-1">
                    <button type="button" onClick={() => handleEditar(perfil)} title="Editar" className="h-7 w-7 flex items-center justify-center rounded-md border">
                      <Pencil size={13} />
                    </button>
                    <button type="button" onClick={() => handleExcluir(perfil)} title="Excluir" className="h-7 w-7 flex items-center justify-center rounded-md border text-destructive">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{perfilEditando ? 'Editar Perfil' : 'Novo Perfil'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Nome do perfil</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Vendedor, Recepcionista..."
                className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
              {categorias.map((categoria) => (
                <div key={categoria} className="space-y-1.5">
                  <h3 className="text-xs font-semibold uppercase text-muted-foreground">{categoria}</h3>
                  {(catalogo ?? [])
                    .filter((p) => p.categoria === categoria)
                    .map((permissao) => (
                      <label key={permissao.id} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={codigosSelecionados.has(permissao.codigo)} onChange={() => alternarCodigo(permissao.codigo)} />
                        {permissao.descricao}
                      </label>
                    ))}
                </div>
              ))}
            </div>
            <button
              type="button"
              disabled={!nome.trim() || salvando}
              onClick={handleSalvar}
              className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
