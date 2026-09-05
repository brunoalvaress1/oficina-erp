import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Ban, CheckCircle2, KeyRound, Plus, TriangleAlert } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CampoMoeda } from '@/components/ui/CampoMoeda'
import { CardIndicador } from '@/features/financeiro/components/CardIndicador'
import { useConfigPlataforma } from '@/features/pagamentoSistema/hooks/usePagamentoSistema'
import { diasParaVencimento, DIAS_LIMITE_VENCENDO } from '@/features/pagamentoSistema/utils'
import {
  useAtualizarChavePixPlataforma,
  useAtualizarStatusOficinaAdmin,
  useAtualizarValorMensalidadeOficinaAdmin,
  useAtualizarVencimentoOficinaAdmin,
  useCriarOficinaAdmin,
  useOficinasAdmin,
} from '../hooks/useSuperAdmin'
import type { CriarOficinaInput, OficinaAdmin } from '../types/oficinaAdmin'

function estaVencida(vencimento: string | null): boolean {
  const dias = diasParaVencimento(vencimento)
  return dias != null && dias < 0
}

// Prioridade pra ordenar a lista com quem precisa de atenção primeiro:
// vencida > vencendo em breve > sem vencimento definido > em dia.
function prioridadeUrgencia(oficina: OficinaAdmin): number {
  if (oficina.statusAssinatura === 'bloqueada') return 0
  const dias = diasParaVencimento(oficina.vencimentoMensalidade)
  if (dias == null) return 3
  if (dias < 0) return 1
  if (dias <= DIAS_LIMITE_VENCENDO) return 2
  return 4
}

function SituacaoVencimento({ oficina }: { oficina: OficinaAdmin }) {
  if (oficina.statusAssinatura === 'bloqueada') return null
  const dias = diasParaVencimento(oficina.vencimentoMensalidade)
  if (dias == null) return <p className="text-xs text-muted-foreground mt-0.5">Sem vencimento definido</p>
  if (dias < 0) {
    return (
      <p className="text-xs font-medium text-red-600 mt-0.5 flex items-center gap-1">
        <TriangleAlert size={11} /> Vencida há {Math.abs(dias)} dia{Math.abs(dias) === 1 ? '' : 's'}
      </p>
    )
  }
  if (dias === 0) {
    return (
      <p className="text-xs font-medium text-amber-600 mt-0.5 flex items-center gap-1">
        <AlertTriangle size={11} /> Vence hoje
      </p>
    )
  }
  if (dias <= DIAS_LIMITE_VENCENDO) {
    return (
      <p className="text-xs font-medium text-amber-600 mt-0.5 flex items-center gap-1">
        <AlertTriangle size={11} /> Vence em {dias} dia{dias === 1 ? '' : 's'}
      </p>
    )
  }
  return <p className="text-xs text-muted-foreground mt-0.5">Em dia ({dias} dias)</p>
}

function InputVencimento({ oficina }: { oficina: OficinaAdmin }) {
  const [valor, setValor] = useState(oficina.vencimentoMensalidade ?? '')
  const atualizar = useAtualizarVencimentoOficinaAdmin()

  return (
    <input
      type="date"
      value={valor}
      onChange={(e) => setValor(e.target.value)}
      onBlur={() => {
        if (valor !== (oficina.vencimentoMensalidade ?? '')) atualizar.mutate({ oficinaId: oficina.id, vencimentoMensalidade: valor || null })
      }}
      className={`h-8 rounded-md border bg-transparent px-2 text-xs outline-none focus:ring-1 focus:ring-primary/30 ${estaVencida(oficina.vencimentoMensalidade) && oficina.statusAssinatura === 'ativa' ? 'border-destructive text-destructive' : ''}`}
    />
  )
}

function InputValorMensalidade({ oficina }: { oficina: OficinaAdmin }) {
  const valorOriginal = oficina.valorMensalidade != null ? String(oficina.valorMensalidade) : ''
  const [valor, setValor] = useState(valorOriginal)
  const atualizar = useAtualizarValorMensalidadeOficinaAdmin()

  function handleBlur() {
    if (valor !== valorOriginal) atualizar.mutate({ oficinaId: oficina.id, valorMensalidade: valor ? Number(valor) : null })
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-muted-foreground">R$</span>
      <CampoMoeda
        value={valor}
        onChange={setValor}
        onBlur={handleBlur}
        placeholder="0,00"
        className="h-8 w-20 rounded-md border bg-transparent px-2 text-xs outline-none focus:ring-1 focus:ring-primary/30"
      />
    </div>
  )
}

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

// Chave PIX que aparece pra TODA oficina em "Pagamento do Sistema" (mesmo
// bloqueada) — antes ficava fixa no código-fonte, agora é configurável aqui.
function CardChavePix() {
  const { data: config, isLoading } = useConfigPlataforma()
  const atualizar = useAtualizarChavePixPlataforma()
  const [chavePix, setChavePix] = useState('')

  // Só sincroniza do servidor pro campo enquanto ele não tiver sido editado
  // na tela ainda (evita sobrescrever o que a pessoa acabou de digitar caso
  // a query refaça o fetch em segundo plano).
  useEffect(() => {
    if (config?.chavePix != null) setChavePix((atual) => (atual === '' ? config.chavePix ?? '' : atual))
  }, [config?.chavePix])

  const alterado = chavePix.trim() !== (config?.chavePix ?? '').trim()

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center size-8 rounded-md bg-primary/10 text-primary shrink-0">
          <KeyRound size={16} />
        </div>
        <div>
          <h2 className="text-sm font-semibold">Chave PIX de cobrança</h2>
          <p className="text-xs text-muted-foreground">
            É essa chave que aparece pra toda oficina pagar a mensalidade do sistema (tela "Pagamento do Sistema").
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 max-w-md">
        <input
          value={chavePix}
          onChange={(e) => setChavePix(e.target.value)}
          disabled={isLoading}
          placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
          className="flex-1 h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
        />
        <button
          type="button"
          disabled={!alterado || !chavePix.trim() || atualizar.isPending}
          onClick={() => atualizar.mutate(chavePix.trim())}
          className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 shrink-0"
        >
          {atualizar.isPending ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}

export function SuperAdminOficinas() {
  const { data: oficinasCarregadas, isLoading } = useOficinasAdmin()
  const atualizar = useAtualizarStatusOficinaAdmin()
  const [modalCriarAberto, setModalCriarAberto] = useState(false)
  const [oficinaParaBloquear, setOficinaParaBloquear] = useState<OficinaAdmin | null>(null)

  const oficinas = useMemo(
    () => [...(oficinasCarregadas ?? [])].sort((a, b) => prioridadeUrgencia(a) - prioridadeUrgencia(b)),
    [oficinasCarregadas],
  )

  const qtdVencidas = oficinas.filter((o) => o.statusAssinatura === 'ativa' && estaVencida(o.vencimentoMensalidade)).length
  const qtdVencendoEmBreve = oficinas.filter((o) => {
    if (o.statusAssinatura !== 'ativa') return false
    const dias = diasParaVencimento(o.vencimentoMensalidade)
    return dias != null && dias >= 0 && dias <= DIAS_LIMITE_VENCENDO
  }).length
  const qtdBloqueadas = oficinas.filter((o) => o.statusAssinatura === 'bloqueada').length

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

      <CardChavePix />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <CardIndicador titulo="Total de Oficinas" valor={String(oficinas.length)} />
        <CardIndicador titulo="Mensalidade Vencida" valor={String(qtdVencidas)} destaque={qtdVencidas > 0 ? 'negativo' : 'neutro'} />
        <CardIndicador titulo="Vencendo em até 5 dias" valor={String(qtdVencendoEmBreve)} destaque={qtdVencendoEmBreve > 0 ? 'negativo' : 'neutro'} />
        <CardIndicador titulo="Bloqueadas" valor={String(qtdBloqueadas)} destaque={qtdBloqueadas > 0 ? 'negativo' : 'neutro'} />
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-3 py-2">Nome</th>
              <th className="text-left font-medium px-3 py-2">CNPJ</th>
              <th className="text-left font-medium px-3 py-2">E-mail</th>
              <th className="text-left font-medium px-3 py-2">Funcionários</th>
              <th className="text-left font-medium px-3 py-2">Vencimento</th>
              <th className="text-left font-medium px-3 py-2">Valor</th>
              <th className="text-left font-medium px-3 py-2">Status</th>
              <th className="text-right font-medium px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">Carregando...</td></tr>
            )}
            {!isLoading && (oficinas ?? []).length === 0 && (
              <tr><td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">Nenhuma oficina cadastrada</td></tr>
            )}
            {(oficinas ?? []).map((oficina) => (
              <tr key={oficina.id} className="border-t">
                <td className="px-3 py-2 font-medium">{oficina.nomeFantasia ?? '-'}</td>
                <td className="px-3 py-2">{oficina.cnpj ?? '-'}</td>
                <td className="px-3 py-2">{oficina.email ?? '-'}</td>
                <td className="px-3 py-2">{oficina.qtdFuncionarios}</td>
                <td className="px-3 py-2">
                  <InputVencimento oficina={oficina} />
                  <SituacaoVencimento oficina={oficina} />
                </td>
                <td className="px-3 py-2">
                  <InputValorMensalidade oficina={oficina} />
                </td>
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
