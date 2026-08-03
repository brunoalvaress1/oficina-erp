import { ListaDeToggles } from '../components/ListaDeToggles'
import { useAlternarNotificacaoConfig, useNotificacoesConfig } from '../hooks/useNotificacoesConfig'
import { ROTULO_NOTIFICACAO } from '../types/operacional'

export function Notificacoes() {
  const { data: notificacoes, isLoading } = useNotificacoesConfig()
  const alternar = useAlternarNotificacaoConfig()

  const itens = (notificacoes ?? []).map((n) => ({ id: n.id, rotulo: ROTULO_NOTIFICACAO[n.tipo] ?? n.tipo, ativo: n.ativo }))

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">Notificações</h1>
        <p className="text-sm text-muted-foreground">
          Escolha quais alertas ficam ativos. <strong>Ainda não existe um motor de notificação em tempo real</strong> — essa tela
          guarda a preferência para quando essa automação for construída.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <ListaDeToggles itens={itens} onAlternar={(id, ativo) => alternar.mutate({ id, ativo })} desabilitado={alternar.isPending} />
      )}
    </div>
  )
}
