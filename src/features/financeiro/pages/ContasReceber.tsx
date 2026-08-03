import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDebouncedCallback } from 'use-debounce'
import { Plus, Ban } from 'lucide-react'
import { formatCurrency, formatDate } from '@/utils/format'
import { Pagination } from '@/components/ui/Pagination'
import { useCaixaLancamentos } from '@/features/caixa/hooks/useCaixaLancamentos'
import { PermissionGate } from '../components/PermissionGate'
import { ExportMenu } from '../components/ExportMenu'
import { ContaReceberModal } from '../components/ContaReceberModal'
import { BaixaContaReceberModal } from '../components/BaixaContaReceberModal'
import { useCancelarContaReceber, useContasReceber } from '../hooks/useContasReceber'
import { ROTULO_STATUS_CONTA_RECEBER, type ContaReceber, type FiltroStatusContaReceber } from '../types/contaReceber'
import type { ColunaExport } from '../services/exportService'

const FILTROS: Array<{ valor: FiltroStatusContaReceber; rotulo: string }> = [
  { valor: 'todas', rotulo: 'Todas' },
  { valor: 'pendente', rotulo: 'Pendentes' },
  { valor: 'parcial', rotulo: 'Parciais' },
  { valor: 'atrasado', rotulo: 'Atrasadas' },
  { valor: 'recebido', rotulo: 'Recebidas' },
  { valor: 'cancelado', rotulo: 'Canceladas' },
]

const COLUNAS_EXPORT: ColunaExport<ContaReceber>[] = [
  { chave: 'documento', titulo: 'Documento', valor: (c) => c.documento ?? '' },
  { chave: 'cliente', titulo: 'Cliente', valor: (c) => c.clienteNome ?? c.clienteNomeAvulso ?? '' },
  { chave: 'descricao', titulo: 'Descrição', valor: (c) => c.descricao },
  { chave: 'valor', titulo: 'Valor', valor: (c) => c.valor },
  { chave: 'recebido', titulo: 'Recebido', valor: (c) => c.valorRecebido },
  { chave: 'vencimento', titulo: 'Vencimento', valor: (c) => formatDate(c.dataVencimento) },
  { chave: 'status', titulo: 'Status', valor: (c) => ROTULO_STATUS_CONTA_RECEBER[c.status] },
]

export function ContasReceber() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [busca, setBusca] = useState('')
  const [buscaDebounced, setBuscaDebounced] = useState('')
  const [status, setStatus] = useState<FiltroStatusContaReceber>('todas')
  const [modalNovaAberto, setModalNovaAberto] = useState(false)
  const [contaParaBaixa, setContaParaBaixa] = useState<ContaReceber | null>(null)

  const aplicarBusca = useDebouncedCallback((valor: string) => {
    setBuscaDebounced(valor)
    setPage(1)
  }, 300)

  const { data, isLoading } = useContasReceber({ page, pageSize, search: buscaDebounced, status })
  const { data: osAguardando } = useCaixaLancamentos({ page: 1, pageSize: 1, filtro: 'aguardando' })
  const { data: osPendente } = useCaixaLancamentos({ page: 1, pageSize: 1, filtro: 'pendente' })
  const cancelar = useCancelarContaReceber()

  const contas = data?.data ?? []
  const total = data?.total ?? 0

  function handleCancelar(conta: ContaReceber) {
    const motivo = prompt('Motivo do cancelamento:')
    if (motivo === null || !motivo.trim()) return
    cancelar.mutate({ contaReceberId: conta.id, motivo: motivo.trim() })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-semibold">Contas a Receber</h1>
        <div className="flex items-center gap-2">
          <ExportMenu linhas={contas} colunas={COLUNAS_EXPORT} nomeBase="contas-a-receber" titulo="Contas a Receber" />
          <PermissionGate codigo="financeiro.lancar">
            <button
              type="button"
              onClick={() => setModalNovaAberto(true)}
              className="flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium"
            >
              <Plus size={15} /> Nova Conta
            </button>
          </PermissionGate>
        </div>
      </div>

      {((osAguardando?.total ?? 0) > 0 || (osPendente?.total ?? 0) > 0) && (
        <button
          type="button"
          onClick={() => navigate('/caixa')}
          className="w-full text-left rounded-lg border bg-amber-50 p-3 text-sm text-amber-800 hover:bg-amber-100"
        >
          {osAguardando?.total ?? 0} ordem(ns) de serviço aguardando pagamento e {osPendente?.total ?? 0} pendente(s) no Caixa. Clique para gerenciar.
        </button>
      )}

      <div className="border rounded-lg overflow-hidden">
        <div className="p-3 border-b bg-muted/20 space-y-2">
          <input
            type="text"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value)
              aplicarBusca(e.target.value)
            }}
            placeholder="Buscar por descrição, documento ou cliente..."
            className="w-full h-9 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="flex flex-wrap gap-2">
            {FILTROS.map((f) => (
              <button
                key={f.valor}
                type="button"
                onClick={() => {
                  setStatus(f.valor)
                  setPage(1)
                }}
                className={`h-7 px-3 rounded-full text-xs font-medium border ${
                  status === f.valor ? 'bg-primary text-primary-foreground border-primary' : 'bg-background'
                }`}
              >
                {f.rotulo}
              </button>
            ))}
          </div>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-3 py-2">Documento</th>
              <th className="text-left font-medium px-3 py-2">Cliente</th>
              <th className="text-left font-medium px-3 py-2">Descrição</th>
              <th className="text-right font-medium px-3 py-2">Valor</th>
              <th className="text-left font-medium px-3 py-2">Vencimento</th>
              <th className="text-left font-medium px-3 py-2">Status</th>
              <th className="text-right font-medium px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            )}
            {!isLoading && total === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                  Nenhuma conta encontrada
                </td>
              </tr>
            )}
            {contas.map((conta) => (
              <tr key={conta.id} className="border-t hover:bg-muted/20">
                <td className="px-3 py-2">{conta.documento ?? '-'}</td>
                <td className="px-3 py-2">{conta.clienteNome ?? conta.clienteNomeAvulso ?? '-'}</td>
                <td className="px-3 py-2">{conta.descricao}</td>
                <td className="px-3 py-2 text-right">
                  {formatCurrency(conta.valor)}
                  {conta.valorRecebido > 0 && conta.status !== 'recebido' && (
                    <div className="text-xs text-muted-foreground">recebido {formatCurrency(conta.valorRecebido)}</div>
                  )}
                </td>
                <td className="px-3 py-2">{formatDate(conta.dataVencimento)}</td>
                <td className="px-3 py-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      conta.status === 'recebido'
                        ? 'bg-green-100 text-green-700'
                        : conta.status === 'atrasado'
                          ? 'bg-red-100 text-red-700'
                          : conta.status === 'cancelado'
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {ROTULO_STATUS_CONTA_RECEBER[conta.status]}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  {conta.status !== 'recebido' && conta.status !== 'cancelado' && (
                    <div className="flex justify-end gap-1">
                      <PermissionGate codigo="financeiro.lancar">
                        <button
                          type="button"
                          onClick={() => setContaParaBaixa(conta)}
                          className="h-7 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium"
                        >
                          Receber
                        </button>
                      </PermissionGate>
                      <PermissionGate codigo="financeiro.excluir">
                        <button
                          type="button"
                          onClick={() => handleCancelar(conta)}
                          title="Cancelar"
                          className="h-7 w-7 flex items-center justify-center rounded-md border text-destructive"
                        >
                          <Ban size={13} />
                        </button>
                      </PermissionGate>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        totalItems={total}
        itemsMostrados={contas.length}
        itemLabel="contas"
        onPageChange={setPage}
        onPageSizeChange={(novoTamanho) => {
          setPageSize(novoTamanho)
          setPage(1)
        }}
      />

      <ContaReceberModal open={modalNovaAberto} onOpenChange={setModalNovaAberto} />
      <BaixaContaReceberModal conta={contaParaBaixa} onOpenChange={(open) => !open && setContaParaBaixa(null)} />
    </div>
  )
}
