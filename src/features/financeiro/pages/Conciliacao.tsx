import { useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { CheckCircle2, Search, TriangleAlert, X } from 'lucide-react'
import { CampoMoeda } from '@/components/ui/CampoMoeda'
import { formatCurrency, formatDate } from '@/utils/format'
import { PermissionGate } from '../components/PermissionGate'
import { useConciliarMovimentacao, useMovimentacoes } from '../hooks/useMovimentacoes'
import type { MovimentacaoFinanceira } from '../types/movimentacaoFinanceira'

// Conciliação é totalmente automática por padrão (todo lançamento já nasce
// conciliado) — essa tela só serve pra registrar, de forma opcional, quando um
// valor bateu diferente do esperado. Não é mais uma fila obrigatória.
export function Conciliacao() {
  const [busca, setBusca] = useState('')
  const [buscaDebounced, setBuscaDebounced] = useState('')
  const [ajustando, setAjustando] = useState<MovimentacaoFinanceira | null>(null)
  const [valorAjuste, setValorAjuste] = useState('')

  const aplicarBusca = useDebouncedCallback((valor: string) => setBuscaDebounced(valor), 300)

  const { data: divergencias, isLoading: carregandoDivergencias } = useMovimentacoes({
    page: 1,
    pageSize: 50,
    tipo: 'entrada',
    apenasComRegistroDivergencia: true,
  })

  const { data: resultadoBusca, isLoading: carregandoBusca } = useMovimentacoes({
    page: 1,
    pageSize: 20,
    tipo: 'entrada',
    search: buscaDebounced,
  })

  const conciliar = useConciliarMovimentacao()

  const listaDivergencias = (divergencias?.data ?? []).filter(
    (m) => m.valorConciliado != null && Math.abs(m.valorConciliado - m.valorLiquido) > 0.009,
  )

  function abrirAjuste(movimentacao: MovimentacaoFinanceira) {
    setAjustando(movimentacao)
    setValorAjuste(movimentacao.valorConciliado != null ? String(movimentacao.valorConciliado) : String(movimentacao.valorLiquido))
  }

  function confirmarAjuste() {
    if (!ajustando) return
    conciliar.mutate(
      { movimentacaoId: ajustando.id, valorConciliado: Number(valorAjuste) || 0, motivo: 'Ajuste manual de valor recebido' },
      { onSuccess: () => setAjustando(null) },
    )
  }

  function limparDivergencia(movimentacao: MovimentacaoFinanceira) {
    conciliar.mutate({ movimentacaoId: movimentacao.id, valorConciliado: movimentacao.valorLiquido })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Conciliação</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Todo recebimento já é conciliado automaticamente. Use essa tela só se um valor recebido foi diferente do esperado.
        </p>
      </div>

      <div className="space-y-2">
        <h2 className="font-medium text-sm">Divergências registradas</h2>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-3 py-2">Data</th>
                <th className="text-left font-medium px-3 py-2">Descrição</th>
                <th className="text-right font-medium px-3 py-2">Esperado</th>
                <th className="text-right font-medium px-3 py-2">Recebido</th>
                <th className="text-left font-medium px-3 py-2">Diferença</th>
                <th className="text-right font-medium px-3 py-2">Ação</th>
              </tr>
            </thead>
            <tbody>
              {carregandoDivergencias && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                    Carregando...
                  </td>
                </tr>
              )}
              {!carregandoDivergencias && listaDivergencias.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                    <CheckCircle2 size={20} className="mx-auto mb-1 text-green-600" />
                    Nenhuma divergência — está tudo batendo certinho.
                  </td>
                </tr>
              )}
              {listaDivergencias.map((m) => {
                const diferenca = (m.valorConciliado ?? m.valorLiquido) - m.valorLiquido
                return (
                  <tr key={m.id} className="border-t hover:bg-muted/20">
                    <td className="px-3 py-2">{formatDate(m.dataMovimentacao)}</td>
                    <td className="px-3 py-2">{m.descricao}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(m.valorLiquido)}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(m.valorConciliado ?? m.valorLiquido)}</td>
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-1 text-red-600 text-xs">
                        <TriangleAlert size={13} /> {formatCurrency(diferenca)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <PermissionGate codigo="financeiro.conciliar">
                        <button
                          type="button"
                          onClick={() => limparDivergencia(m)}
                          title="Marcar como resolvido (valor esperado está certo)"
                          className="h-7 px-3 rounded-md border text-xs font-medium"
                        >
                          Limpar
                        </button>
                      </PermissionGate>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="font-medium text-sm">Registrar uma divergência</h2>
        <p className="text-xs text-muted-foreground">Busque um recebimento específico só se o valor que entrou foi diferente do esperado.</p>
        <div className="relative max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value)
              aplicarBusca(e.target.value)
            }}
            placeholder="Buscar por descrição..."
            className="w-full h-9 pl-8 pr-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {buscaDebounced && (
          <div className="border rounded-lg overflow-hidden max-w-2xl">
            <table className="w-full text-sm">
              <tbody>
                {carregandoBusca && (
                  <tr>
                    <td className="px-3 py-4 text-center text-muted-foreground">Buscando...</td>
                  </tr>
                )}
                {!carregandoBusca && (resultadoBusca?.data ?? []).length === 0 && (
                  <tr>
                    <td className="px-3 py-4 text-center text-muted-foreground">Nada encontrado</td>
                  </tr>
                )}
                {(resultadoBusca?.data ?? []).map((m) => (
                  <tr key={m.id} className="border-t hover:bg-muted/20">
                    <td className="px-3 py-2">{formatDate(m.dataMovimentacao)}</td>
                    <td className="px-3 py-2">{m.descricao}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(m.valorLiquido)}</td>
                    <td className="px-3 py-2 text-right">
                      <PermissionGate codigo="financeiro.conciliar">
                        <button type="button" onClick={() => abrirAjuste(m)} className="h-7 px-3 rounded-md border text-xs font-medium">
                          Ajustar valor
                        </button>
                      </PermissionGate>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {ajustando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setAjustando(null)}>
          <div className="w-full max-w-sm rounded-lg border bg-background p-4 shadow-lg space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Ajustar valor recebido</h3>
              <button type="button" onClick={() => setAjustando(null)} className="p-1 rounded hover:bg-muted">
                <X size={16} />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">{ajustando.descricao}</p>
            <p className="text-xs text-muted-foreground">Valor esperado: {formatCurrency(ajustando.valorLiquido)}</p>
            <div className="space-y-1">
              <label className="text-sm font-medium">Valor que realmente entrou</label>
              <CampoMoeda
                value={valorAjuste}
                onChange={setValorAjuste}
                className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <button
              type="button"
              disabled={conciliar.isPending}
              onClick={confirmarAjuste}
              className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
            >
              {conciliar.isPending ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
