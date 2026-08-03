import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAtualizarIntegracao, useIntegracoes } from '../hooks/useIntegracoes'
import type { Integracao } from '../types/operacional'

function LinhaIntegracao({ integracao }: { integracao: Integracao }) {
  const atualizar = useAtualizarIntegracao()
  const [token, setToken] = useState(integracao.token ?? '')
  const [apiKey, setApiKey] = useState(integracao.apiKey ?? '')
  const [mostrarSegredos, setMostrarSegredos] = useState(false)

  function salvar() {
    atualizar.mutate({ id: integracao.id, alteracoes: { token: token || null, apiKey: apiKey || null } })
  }

  function alternarStatus() {
    atualizar.mutate({ id: integracao.id, alteracoes: { status: !integracao.status } })
  }

  return (
    <div className="rounded-lg border p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{integracao.nome}</span>
        <button
          type="button"
          onClick={alternarStatus}
          className={`h-6 px-2 rounded-full text-xs font-medium border ${integracao.status ? 'bg-green-500/10 text-green-600 border-green-500/30' : 'bg-muted text-muted-foreground'}`}
        >
          {integracao.status ? 'Ativa' : 'Inativa'}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Token</label>
          <input
            type={mostrarSegredos ? 'text' : 'password'}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full h-8 rounded-md border bg-transparent px-2 text-sm outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">API Key</label>
          <input
            type={mostrarSegredos ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full h-8 rounded-md border bg-transparent px-2 text-sm outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={salvar} disabled={atualizar.isPending} className="h-8 px-4 rounded-md border text-xs font-medium disabled:opacity-50">
          {atualizar.isPending ? 'Salvando...' : 'Salvar'}
        </button>
        <button type="button" onClick={() => setMostrarSegredos((v) => !v)} className="flex items-center gap-1 h-8 px-2 rounded-md text-xs text-muted-foreground">
          {mostrarSegredos ? <EyeOff size={13} /> : <Eye size={13} />} {mostrarSegredos ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>
    </div>
  )
}

export function Integracoes() {
  const { data: integracoes, isLoading } = useIntegracoes()
  // 'nfe' e 'whatsapp' têm página dedicada (Configurações > Nota Fiscal /
  // WhatsApp) porque o token/chave de verdade fica em segredo no servidor,
  // não editável aqui.
  const integracoesExibidas = (integracoes ?? []).filter((i) => i.codigo !== 'nfe' && i.codigo !== 'whatsapp')

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold">Integrações</h1>
        <p className="text-sm text-muted-foreground">
          Guarde aqui os tokens e chaves das integrações externas. <strong>Nenhuma integração roda automaticamente ainda</strong> —
          essa tela só armazena as credenciais para quando as automações forem construídas. A emissão de Nota Fiscal fica em{' '}
          <Link to="/configuracoes/nota-fiscal" className="text-primary underline">Configurações → Nota Fiscal</Link>, e o envio
          automático de WhatsApp fica em{' '}
          <Link to="/configuracoes/whatsapp" className="text-primary underline">Configurações → WhatsApp</Link>.
        </p>
      </div>

      <div className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {integracoesExibidas.map((integracao) => (
          <LinhaIntegracao key={integracao.id} integracao={integracao} />
        ))}
      </div>
    </div>
  )
}
