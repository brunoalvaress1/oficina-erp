import { formatDate } from '@/utils/format'
import type { OrdemServicoHistoricoEntry } from '../types/ordemServico'

const ROTULOS_ACAO: Record<string, string> = {
  criada: 'Ordem criada',
  item_adicionado: 'Item adicionado',
  item_atualizado: 'Item atualizado',
  item_removido: 'Item removido',
  item_aprovado: 'Item aprovado',
  item_recusado: 'Item recusado',
  item_aprovacao_pendente: 'Aprovação do item revertida para aguardando',
  cabecalho_atualizado: 'Dados da ordem atualizados',
  status_alterado: 'Status alterado',
  finalizada: 'Ordem finalizada e enviada ao caixa',
  reaberta: 'Ordem reaberta',
}

function descreverDetalhes(entrada: OrdemServicoHistoricoEntry): string | null {
  const detalhes = entrada.detalhes
  if (!detalhes) return null

  if (typeof detalhes.campo === 'string' && 'de' in detalhes && 'para' in detalhes) {
    const descricao = typeof detalhes.descricao === 'string' ? `${detalhes.descricao}: ` : ''
    return `${descricao}${String(detalhes.campo)} ${String(detalhes.de ?? '-')} → ${String(detalhes.para ?? '-')}`
  }
  if ('de' in detalhes && 'para' in detalhes) {
    return `${String(detalhes.de ?? '-')} → ${String(detalhes.para ?? '-')}`
  }
  if (typeof detalhes.descricao === 'string') {
    return detalhes.descricao
  }
  return null
}

interface HistoricoOrdemProps {
  historico: OrdemServicoHistoricoEntry[]
}

export function HistoricoOrdem({ historico }: HistoricoOrdemProps) {
  return (
    <div className="space-y-2">
      <h2 className="font-medium">Histórico</h2>
      <div className="border rounded-lg divide-y">
        {historico.length === 0 && <p className="px-4 py-3 text-sm text-muted-foreground">Sem histórico</p>}
        {historico.map((entrada) => {
          const detalhe = descreverDetalhes(entrada)
          return (
            <div key={entrada.id} className="px-4 py-2.5 text-sm flex items-center justify-between gap-3">
              <span>
                <span className="font-medium">{ROTULOS_ACAO[entrada.acao] ?? entrada.acao}</span>
                {detalhe && <span className="text-muted-foreground"> — {detalhe}</span>}
                {entrada.funcionarioNome && <span className="text-muted-foreground"> por {entrada.funcionarioNome}</span>}
              </span>
              <span className="text-muted-foreground text-xs shrink-0">{formatDate(entrada.createdAt)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
