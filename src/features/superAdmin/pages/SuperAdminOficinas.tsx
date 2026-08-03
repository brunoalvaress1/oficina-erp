import { useState } from 'react'
import { Ban, CheckCircle2, Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatDate } from '@/utils/format'
import { useAtualizarStatusOficinaAdmin, useCriarOficinaAdmin, useOficinasAdmin } from '../hooks/useSuperAdmin'
import type { CriarOficinaInput, OficinaAdmin } from '../types/oficinaAdmin'

const CAMPO_VAZIO: CriarOficinaInput = { nomeFantasia: '', razaoSocial: '', cnpj: '', emailAdmin: '', senhaAdmin: '', nomeAdmin: '' }

function ModalCriarOficina({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [form, setForm] = useState<CriarOficinaInput>(CAMPO_VAZIO)
  const criar = useCriarOficinaAdmin()

  function set<K extends keyof CriarOficinaInput>(campo: K, valor: CriarOficinaInput[K]) {
    setForm((atual) => ({ ...atual, [campo]: valor }))
  }

  function handleCriar() {
    criar.mutate(form, {
      onSuccess: () => {
        setForm(CAMPO_VAZIO)
        onOpenChange(false)
      },
    })
  }

  const valido = form.nomeFantasia.trim() && form.emailAdmin.trim() && form.senhaAdmin.trim().length >= 6 && form.nomeAdmin.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Oficina</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Nome Fantasia *</label>
            <input value={form.nomeFantasia} onChange={(e) => set('nomeFantasia', e.target.value)} className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Razão Social</label>
            <input value={form.razaoSocial} onChange={(e) => set('razaoSocial', e.target.value)} className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">CNPJ</label>
            <input value={form.cnpj} onChange={(e) => set('cnpj', e.target.value)} className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30" />
          </div>
          <div className="border-t pt-3 space-y-3">
            <p className="text-xs text-muted-foreground">Login do primeiro usuário (administrador) dessa oficina.</p>
            <div className="space-y-1">
              <label className="text-sm font-medium">Nome do administrador *</label>
              <input value={form.nomeAdmin} onChange={(e) => set('nomeAdmin', e.target.value)} className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">E-mail de login *</label>
              <input type="email" value={form.emailAdmin} onChange={(e) => set('emailAdmin', e.target.value)} className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Senha *</label>
              <input type="password" value={form.senhaAdmin} onChange={(e) => set('senhaAdmin', e.target.value)} placeholder="Mínimo 6 caracteres" className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30" />
            </div>
          </div>
          <button
            type="button"
            disabled={!valido || criar.isPending}
            onClick={handleCriar}
            className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
          >
            {criar.isPending ? 'Criando...' : 'Criar Oficina'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ModalBloquear({ oficina, onOpenChange }: { oficina: OficinaAdmin | null; onOpenChange: (open: boolean) => void }) {
  const [motivo, setMotivo] = useState('')
  const atualizar = useAtualizarStatusOficinaAdmin()

  function handleBloquear() {
    if (!oficina) return
    atualizar.mutate({ oficinaId: oficina.id, statusAssinatura: 'bloqueada', motivo }, { onSuccess: () => { setMotivo(''); onOpenChange(false) } })
  }

  return (
    <Dialog open={!!oficina} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Bloquear {oficina?.nomeFantasia}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Os funcionários dessa oficina perdem acesso ao sistema imediatamente.</p>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Motivo (ex: mensalidade em atraso)"
            rows={3}
            className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/30"
          />
          <button
            type="button"
            disabled={atualizar.isPending}
            onClick={handleBloquear}
            className="w-full h-10 rounded-md bg-destructive text-destructive-foreground text-sm font-medium disabled:opacity-50"
          >
            {atualizar.isPending ? 'Bloqueando...' : 'Confirmar Bloqueio'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function SuperAdminOficinas() {
  const { data: oficinas, isLoading } = useOficinasAdmin()
  const atualizar = useAtualizarStatusOficinaAdmin()
  const [modalCriarAberto, setModalCriarAberto] = useState(false)
  const [oficinaParaBloquear, setOficinaParaBloquear] = useState<OficinaAdmin | null>(null)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Oficinas</h1>
          <p className="text-sm text-muted-foreground">Gestão de todas as oficinas cadastradas na plataforma.</p>
        </div>
        <button
          type="button"
          onClick={() => setModalCriarAberto(true)}
          className="flex items-center gap-1 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium"
        >
          <Plus size={14} /> Nova Oficina
        </button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-3 py-2">Nome</th>
              <th className="text-left font-medium px-3 py-2">CNPJ</th>
              <th className="text-left font-medium px-3 py-2">E-mail</th>
              <th className="text-left font-medium px-3 py-2">Funcionários</th>
              <th className="text-left font-medium px-3 py-2">Criada em</th>
              <th className="text-left font-medium px-3 py-2">Status</th>
              <th className="text-right font-medium px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">Carregando...</td></tr>
            )}
            {!isLoading && (oficinas ?? []).length === 0 && (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">Nenhuma oficina cadastrada</td></tr>
            )}
            {(oficinas ?? []).map((oficina) => (
              <tr key={oficina.id} className="border-t">
                <td className="px-3 py-2 font-medium">{oficina.nomeFantasia ?? '-'}</td>
                <td className="px-3 py-2">{oficina.cnpj ?? '-'}</td>
                <td className="px-3 py-2">{oficina.email ?? '-'}</td>
                <td className="px-3 py-2">{oficina.qtdFuncionarios}</td>
                <td className="px-3 py-2 text-muted-foreground">{formatDate(oficina.createdAt)}</td>
                <td className="px-3 py-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${oficina.statusAssinatura === 'ativa' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                    {oficina.statusAssinatura === 'ativa' ? 'Ativa' : 'Bloqueada'}
                  </span>
                  {oficina.bloqueadaMotivo && <p className="text-xs text-muted-foreground mt-0.5 max-w-[200px] truncate" title={oficina.bloqueadaMotivo}>{oficina.bloqueadaMotivo}</p>}
                </td>
                <td className="px-3 py-2">
                  <div className="flex justify-end">
                    {oficina.statusAssinatura === 'ativa' ? (
                      <button
                        type="button"
                        onClick={() => setOficinaParaBloquear(oficina)}
                        title="Bloquear"
                        className="h-7 w-7 flex items-center justify-center rounded-md border text-destructive"
                      >
                        <Ban size={13} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => atualizar.mutate({ oficinaId: oficina.id, statusAssinatura: 'ativa' })}
                        disabled={atualizar.isPending}
                        title="Reativar"
                        className="h-7 w-7 flex items-center justify-center rounded-md border text-green-600 disabled:opacity-50"
                      >
                        <CheckCircle2 size={13} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ModalCriarOficina open={modalCriarAberto} onOpenChange={setModalCriarAberto} />
      <ModalBloquear oficina={oficinaParaBloquear} onOpenChange={(open) => !open && setOficinaParaBloquear(null)} />
    </div>
  )
}
