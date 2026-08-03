import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAtualizarIntegracao, useIntegracoes } from '../hooks/useIntegracoes'

export function WhatsApp() {
  const { data: integracoes, isLoading } = useIntegracoes()
  const atualizar = useAtualizarIntegracao()

  const integracaoWhatsapp = (integracoes ?? []).find((i) => i.codigo === 'whatsapp')
  const [instanceName, setInstanceName] = useState('')

  useEffect(() => {
    if (integracaoWhatsapp) {
      const config = integracaoWhatsapp.config as any
      setInstanceName(config?.instanceName ?? '')
    }
  }, [integracaoWhatsapp])

  function salvarInstanceName() {
    if (!integracaoWhatsapp) return
    atualizar.mutate({ id: integracaoWhatsapp.id, alteracoes: { config: { instanceName: instanceName || null } } })
  }

  function alternarAtivo() {
    if (!integracaoWhatsapp) return
    atualizar.mutate({ id: integracaoWhatsapp.id, alteracoes: { status: !integracaoWhatsapp.status } })
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando...</p>

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">WhatsApp</h1>
        <p className="text-sm text-muted-foreground">
          Envio automático de mensagem pro cliente quando a OS é finalizada e enviada ao Caixa, via Evolution API. Usa a
          mesma mensagem padrão configurada em{' '}
          <Link to="/configuracoes/dados-oficina" className="text-primary underline">Configurações → Dados da Oficina</Link>.
        </p>
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-sm">Status</h2>
          <button
            type="button"
            onClick={alternarAtivo}
            disabled={!integracaoWhatsapp || atualizar.isPending}
            className={`h-6 px-2 rounded-full text-xs font-medium border disabled:opacity-50 ${integracaoWhatsapp?.status ? 'bg-green-500/10 text-green-600 border-green-500/30' : 'bg-muted text-muted-foreground'}`}
          >
            {integracaoWhatsapp?.status ? 'Ativa' : 'Inativa'}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Só envia a mensagem automática quando estiver Ativa. A URL e a chave da Evolution API ficam configuradas com
          segurança direto no servidor (Supabase Edge Function secrets) — não são editáveis por aqui.
        </p>
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <h2 className="font-medium text-sm">Nome da instância</h2>
        <p className="text-xs text-muted-foreground">
          O nome que você deu à instância no Manager da Evolution API ao conectar o número via QR code (ex: "oficina").
        </p>
        <input
          type="text"
          value={instanceName}
          onChange={(e) => setInstanceName(e.target.value)}
          onBlur={salvarInstanceName}
          disabled={!integracaoWhatsapp || atualizar.isPending}
          placeholder="oficina"
          className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
        />
      </div>
    </div>
  )
}
