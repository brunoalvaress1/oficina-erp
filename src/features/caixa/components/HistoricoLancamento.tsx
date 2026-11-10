import { formatCurrency, formatDate } from '@/utils/format'
import type { CaixaLancamentoHistoricoEntry } from '../types/caixa'

const ROTULOS_ACAO: Record<string, string> = {
  recebido: 'Pagamento recebido (completo)',
  recebido_parcial: 'Pagamento parcial recebido',
  marcado_pendente: 'Movido para Pendentes',
  cancelado: 'Recebimento cancelado',
}

function numero(valor: unknown): number {
  return typeof valor === 'number' ? valor : Number(valor ?? 0)
}

function descreverDetalhes(entrada: CaixaLancamentoHistoricoEntry): string | null {
  const detalhes = entrada.detalhes
  if (!detalhes) return null
  if (entrada.acao === 'cancelado' && typeof detalhes.motivo === 'string' && detalhes.motivo) {
    return `Motivo: ${detalhes.motivo}`
  }
  if (entrada.acao === 'marcado_pendente' && typeof detalhes.observacoes === 'string' && detalhes.observacoes) {
    return detalhes.observacoes
  }
  if (entrada.acao === 'recebido' || entrada.acao === 'recebido_parcial') {
    const valorRecebido = numero(detalhes.valorTotal)
    const valorPendente = numero(detalhes.valorPendente)
    const desconto = numero(detalhes.desconto)
    const partes = [`${formatCurrency(valorRecebido)} recebido`]
    if (desconto > 0) partes.push(`${formatCurrency(desconto)} de desconto`)
    if (valorPendente > 0) partes.push(`${formatCurrency(valorPendente)} ficou pendente`)
    return partes.join(' · ')
  }
  return null
}

interface HistoricoLancamentoProps {
  historico: CaixaLancamentoHistoricoEntry[]
  dataAberturaOs?: string
}

export function HistoricoLancamento({ historico, dataAberturaOs }: HistoricoLancamentoProps) {
  return (
    <div className="space-y-2">
      <h2 className="font-medium">Histórico</h2>
      <div className="border rounded-lg divide-y">
        {dataAberturaOs && (
          <div className="px-4 py-2.5 text-sm flex items-center justify-between gap-3 bg-muted/30">
            <span className="font-medium">OS aberta</span>
            <span className="text-muted-foreground text-xs shrink-0">{formatDate(dataAberturaOs)}</span>
          </div>
        )}
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
