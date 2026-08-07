import { useEffect, useState } from 'react'
import { Eye, EyeOff, RefreshCw } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PermissionGate } from './PermissionGate'
import { PermissoesChecklist } from './PermissoesChecklist'
import { HistoricoFuncionario } from './HistoricoFuncionario'
import { useCriarFuncionario, useAtualizarFuncionario } from '../hooks/useFuncionarioMutations'
import { usePermissoesCatalogo } from '../hooks/usePermissoesCatalogo'
import { useDefinirPermissoes, usePermissoesDoFuncionario } from '../hooks/usePermissoesDoFuncionario'
import { useHistoricoFuncionario } from '../hooks/useHistoricoFuncionario'
import { usePerfis } from '@/features/configuracoes/hooks/usePerfis'
import type { Funcionario } from '../types/funcionario'

const CARGOS_SUGERIDOS = ['Administrador', 'Mecânico', 'Recepcionista', 'Vendedor']

function gerarSenhaAleatoria(): string {
  const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let senha = ''
  for (let i = 0; i < 10; i++) senha += caracteres[Math.floor(Math.random() * caracteres.length)]
  return senha
}

interface FuncionarioModalProps {
  funcionario: Funcionario | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FuncionarioModal({ funcionario, open, onOpenChange }: FuncionarioModalProps) {
  const ehEdicao = !!funcionario
  const [aba, setAba] = useState<'dados' | 'permissoes' | 'historico'>('dados')

  const [nome, setNome] = useState('')
  const [cargo, setCargo] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [ativo, setAtivo] = useState(true)

  const criar = useCriarFuncionario()
  const atualizar = useAtualizarFuncionario()

  useEffect(() => {
    if (!open) return
    setAba('dados')
    if (funcionario) {
      setNome(funcionario.nome)
      setCargo(funcionario.cargo ?? '')
      setEmail(funcionario.email ?? '')
      setAtivo(funcionario.ativo)
      setSenha('')
    } else {
      setNome('')
      setCargo('')
      setEmail('')
      setSenha(gerarSenhaAleatoria())
      setAtivo(true)
    }
  }, [funcionario, open])

  const { data: catalogo } = usePermissoesCatalogo()
  const { data: perfis } = usePerfis()
  const { data: permissoesConcedidas } = usePermissoesDoFuncionario(funcionario?.id)
  const definirPermissoes = useDefinirPermissoes()
  const [codigosSelecionados, setCodigosSelecionados] = useState<Set<string>>(new Set())
  const [perfilParaAplicar, setPerfilParaAplicar] = useState('')

  useEffect(() => {
    setCodigosSelecionados(new Set(permissoesConcedidas ?? []))
  }, [permissoesConcedidas])

  const { data: historico } = useHistoricoFuncionario(aba === 'historico' ? funcionario?.id : undefined)

  function aplicarPerfil() {
    const perfil = (perfis ?? []).find((p) => p.id === perfilParaAplicar)
    if (!perfil) return
    setCodigosSelecionados((atual) => new Set([...atual, ...perfil.codigos]))
    setPerfilParaAplicar('')
  }

  function handleSalvarDados() {
    if (ehEdicao) {
      atualizar.mutate({ id: funcionario.id, alteracoes: { nome, cargo: cargo || undefined, ativo } }, { onSuccess: () => onOpenChange(false) })
    } else {
      criar.mutate({ nome, cargo: cargo || undefined, email, senha }, { onSuccess: () => onOpenChange(false) })
    }
  }

  function handleSalvarPermissoes() {
    if (!funcionario) return
    definirPermissoes.mutate({ funcionarioId: funcionario.id, codigos: Array.from(codigosSelecionados) })
  }

  const podeSalvarDados = nome.trim() !== '' && (ehEdicao || (email.trim() !== '' && senha.trim().length >= 6))
  const salvandoDados = criar.isPending || atualizar.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{ehEdicao ? `Editar — ${funcionario.nome}` : 'Novo Funcionário'}</DialogTitle>
        </DialogHeader>

        {ehEdicao && (
          <div className="flex gap-2 mb-4">
            <button type="button" onClick={() => setAba('dados')} className={`h-8 px-3 rounded-md text-xs font-medium border ${aba === 'dados' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background'}`}>
              Dados
            </button>
            <PermissionGate codigo="funcionarios.permissoes">
              <button type="button" onClick={() => setAba('permissoes')} className={`h-8 px-3 rounded-md text-xs font-medium border ${aba === 'permissoes' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background'}`}>
                Permissões
              </button>
            </PermissionGate>
            <PermissionGate codigo="funcionarios.permissoes">
              <button type="button" onClick={() => setAba('historico')} className={`h-8 px-3 rounded-md text-xs font-medium border ${aba === 'historico' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background'}`}>
                Histórico
              </button>
            </PermissionGate>
          </div>
        )}

        {aba === 'dados' && (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Nome *</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Cargo</label>
              <input
                type="text"
                list="cargos-sugeridos"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30"
              />
              <datalist id="cargos-sugeridos">
                {CARGOS_SUGERIDOS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">E-mail (login) {!ehEdicao && '*'}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={ehEdicao}
                className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-60"
              />
            </div>

            {!ehEdicao && (
              <div className="space-y-1">
                <label className="text-sm font-medium">Senha temporária *</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={mostrarSenha ? 'text' : 'password'}
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      className="w-full h-9 rounded-md border bg-transparent px-3 pr-9 text-sm outline-none focus:ring-1 focus:ring-primary/30"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {mostrarSenha ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSenha(gerarSenhaAleatoria())}
                    title="Gerar nova senha"
                    className="h-9 w-9 flex items-center justify-center rounded-md border shrink-0"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Anote e repasse essa senha ao funcionário — ele consegue trocar depois de entrar.</p>
              </div>
            )}

            {ehEdicao && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
                Funcionário ativo
              </label>
            )}

            <button
              type="button"
              disabled={!podeSalvarDados || salvandoDados}
              onClick={handleSalvarDados}
              className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
            >
              {salvandoDados ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        )}

        {aba === 'permissoes' && funcionario && (
          <div className="space-y-3">
            {(perfis ?? []).length > 0 && (
              <div className="flex gap-2 items-end p-2 rounded-md border bg-muted/20">
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Aplicar perfil (pré-marca, você ainda confirma abaixo)</label>
                  <select
                    value={perfilParaAplicar}
                    onChange={(e) => setPerfilParaAplicar(e.target.value)}
                    className="w-full h-8 rounded-md border bg-background px-2 text-sm"
                  >
                    <option value="">Selecione...</option>
                    {(perfis ?? []).map((perfil) => (
                      <option key={perfil.id} value={perfil.id}>
                        {perfil.nome} ({perfil.codigos.length})
                      </option>
                    ))}
                  </select>
                </div>
                <button type="button" disabled={!perfilParaAplicar} onClick={aplicarPerfil} className="h-8 px-3 rounded-md border text-xs font-medium disabled:opacity-50">
                  Aplicar
                </button>
              </div>
            )}
            <PermissoesChecklist catalogo={catalogo ?? []} selecionados={codigosSelecionados} onChange={setCodigosSelecionados} />
            <button
              type="button"
              disabled={definirPermissoes.isPending}
              onClick={handleSalvarPermissoes}
              className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
            >
              {definirPermissoes.isPending ? 'Salvando...' : 'Salvar Permissões'}
            </button>
          </div>
        )}

        {aba === 'historico' && <HistoricoFuncionario historico={historico ?? []} />}
      </DialogContent>
    </Dialog>
  )
}
