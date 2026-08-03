import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAtualizarImposto, useCriarImposto, useExcluirImposto, useImpostos } from '../hooks/useImpostos'
import type { Imposto, ImpostoInput } from '../types/catalogos'

const FORM_VAZIO: ImpostoInput = {
  nome: '', ncm: '', cest: '', cfop: '', icmsPercentual: null, ipiPercentual: null,
  pisPercentual: null, cofinsPercentual: null, stPercentual: null, classeFiscal: '', origem: '', ativo: true,
}

function Campo({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30"
      />
    </div>
  )
}

function CampoPercentual({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label} (%)</label>
      <input
        type="number"
        step="0.01"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30"
      />
    </div>
  )
}

export function Impostos() {
  const { data: impostos, isLoading } = useImpostos()
  const criar = useCriarImposto()
  const atualizar = useAtualizarImposto()
  const excluir = useExcluirImposto()

  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Imposto | null>(null)
  const [form, setForm] = useState<ImpostoInput>(FORM_VAZIO)

  useEffect(() => {
    if (!modalAberto) return
    if (editando) {
      const { id, oficinaId, createdAt, ...resto } = editando
      setForm(resto)
    } else {
      setForm(FORM_VAZIO)
    }
  }, [modalAberto, editando])

  function set<K extends keyof ImpostoInput>(campo: K, valor: ImpostoInput[K]) {
    setForm((atual) => ({ ...atual, [campo]: valor }))
  }

  function handleNovo() {
    setEditando(null)
    setModalAberto(true)
  }

  function handleEditar(imposto: Imposto) {
    setEditando(imposto)
    setModalAberto(true)
  }

  function handleSalvar() {
    if (editando) {
      atualizar.mutate({ id: editando.id, input: form }, { onSuccess: () => setModalAberto(false) })
    } else {
      criar.mutate(form, { onSuccess: () => setModalAberto(false) })
    }
  }

  function handleExcluir(imposto: Imposto) {
    if (!confirm(`Excluir o imposto "${imposto.nome}"?`)) return
    excluir.mutate(imposto.id)
  }

  const salvando = criar.isPending || atualizar.isPending

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Impostos</h1>
          <p className="text-sm text-muted-foreground">Cadastro fiscal (NCM/CEST/CFOP e alíquotas) — pode ser vinculado a produtos.</p>
        </div>
        <button type="button" onClick={handleNovo} className="flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium">
          <Plus size={15} /> Novo Imposto
        </button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-3 py-2">Nome</th>
              <th className="text-left font-medium px-3 py-2">NCM</th>
              <th className="text-left font-medium px-3 py-2">ICMS</th>
              <th className="text-left font-medium px-3 py-2">Status</th>
              <th className="text-right font-medium px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">Carregando...</td>
              </tr>
            )}
            {!isLoading && (impostos ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">Nenhum imposto cadastrado</td>
              </tr>
            )}
            {(impostos ?? []).map((imposto) => (
              <tr key={imposto.id} className="border-t">
                <td className="px-3 py-2 font-medium">{imposto.nome}</td>
                <td className="px-3 py-2 text-muted-foreground">{imposto.ncm ?? '-'}</td>
                <td className="px-3 py-2 text-muted-foreground">{imposto.icmsPercentual != null ? `${imposto.icmsPercentual}%` : '-'}</td>
                <td className="px-3 py-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${imposto.ativo ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                    {imposto.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-1">
                    <button type="button" onClick={() => handleEditar(imposto)} title="Editar" className="h-7 w-7 flex items-center justify-center rounded-md border">
                      <Pencil size={13} />
                    </button>
                    <button type="button" onClick={() => handleExcluir(imposto)} title="Excluir" className="h-7 w-7 flex items-center justify-center rounded-md border text-destructive">
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
            <DialogTitle>{editando ? 'Editar Imposto' : 'Novo Imposto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Campo label="Nome" value={form.nome} onChange={(v) => set('nome', v)} placeholder="Ex: Tributação padrão" />
            <div className="grid grid-cols-3 gap-3">
              <Campo label="NCM" value={form.ncm ?? ''} onChange={(v) => set('ncm', v)} />
              <Campo label="CEST" value={form.cest ?? ''} onChange={(v) => set('cest', v)} />
              <Campo label="CFOP" value={form.cfop ?? ''} onChange={(v) => set('cfop', v)} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <CampoPercentual label="ICMS" value={form.icmsPercentual} onChange={(v) => set('icmsPercentual', v)} />
              <CampoPercentual label="IPI" value={form.ipiPercentual} onChange={(v) => set('ipiPercentual', v)} />
              <CampoPercentual label="PIS" value={form.pisPercentual} onChange={(v) => set('pisPercentual', v)} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <CampoPercentual label="COFINS" value={form.cofinsPercentual} onChange={(v) => set('cofinsPercentual', v)} />
              <CampoPercentual label="ST" value={form.stPercentual} onChange={(v) => set('stPercentual', v)} />
              <Campo label="Origem" value={form.origem ?? ''} onChange={(v) => set('origem', v)} placeholder="Ex: Nacional" />
            </div>
            <Campo label="Classe Fiscal" value={form.classeFiscal ?? ''} onChange={(v) => set('classeFiscal', v)} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.ativo} onChange={(e) => set('ativo', e.target.checked)} />
              Ativo
            </label>
            <button
              type="button"
              disabled={!form.nome.trim() || salvando}
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
