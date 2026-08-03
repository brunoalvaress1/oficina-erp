import { formatDate } from '@/utils/format'
import type { HistoricoFuncionarioEntry } from '../types/permissaoCatalogo'

const ROTULOS_ACAO: Record<string, string> = {
  permissoes_alteradas: 'Permissões alteradas',
}

interface HistoricoFuncionarioProps {
  historico: HistoricoFuncionarioEntry[]
}

export function HistoricoFuncionario({ historico }: HistoricoFuncionarioProps) {
  return (
    <div className="border rounded-lg divide-y">
      {historico.length === 0 && <p className="px-4 py-3 text-sm text-muted-foreground">Sem histórico de alterações de permissão.</p>}
      {historico.map((entrada) => (
        <div key={entrada.id} className="px-4 py-2.5 text-sm space-y-1">
          <div className="flex items-center justify-between gap-3">
            <span>
              <span className="font-medium">{ROTULOS_ACAO[entrada.acao] ?? entrada.acao}</span>
              {entrada.alteradoPorNome && <span className="text-muted-foreground"> por {entrada.alteradoPorNome}</span>}
            </span>
            <span className="text-muted-foreground text-xs shrink-0">{formatDate(entrada.createdAt)}</span>
          </div>
          {entrada.detalhes?.depois && (
            <p className="text-xs text-muted-foreground">Permissões após a mudança: {entrada.detalhes.depois.join(', ') || 'nenhuma'}</p>
          )}
        </div>
      ))}
    </div>
  )
}
