import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useHistoricoCaixa } from '../hooks/useHistoricoCaixa'
import { Pagination } from '@/components/ui/Pagination'
import { formatDate } from '@/utils/format'

const ROTULOS_ACAO: Record<string, string> = {
  recebido: 'Recebeu',
  marcado_pendente: 'Moveu para Pendentes',
  cancelado: 'Cancelou recebimento',
}

export function Historico() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(30)
  const [busca, setBusca] = useState('')

  const { data, isLoading } = useHistoricoCaixa({ page, pageSize, search: busca })
  const entradas = data?.data ?? []
  const total = data?.total ?? 0

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Histórico do Caixa</h1>

      <div className="border rounded-lg overflow-hidden">
        <div className="p-3 border-b bg-muted/20">
          <input
            type="text"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value)
              setPage(1)
            }}
            placeholder="Buscar por número da OS, cliente, placa..."
            className="w-full h-9 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="divide-y">
          {isLoading && <p className="px-4 py-6 text-center text-sm text-muted-foreground">Carregando...</p>}
          {!isLoading && total === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">Nenhuma movimentação encontrada</p>
          )}
          {entradas.map((entrada) => (
            <button
              key={entrada.id}
              type="button"
              disabled={!entrada.ordemServicoId}
              onClick={() => entrada.ordemServicoId && navigate(`/ordens/${entrada.ordemServicoId}`)}
              className="w-full text-left px-4 py-3 text-sm hover:bg-muted/20 flex items-center justify-between gap-3 disabled:cursor-default"
            >
              <span>
                <span className="font-medium">{entrada.funcionarioNome ?? 'Sistema'}</span>{' '}
                <span className="text-muted-foreground">{ROTULOS_ACAO[entrada.acao] ?? entrada.acao}</span>{' '}
                <span className="font-medium">OS {entrada.ordemNumero}</span>
                {entrada.clienteNome && <span className="text-muted-foreground"> · {entrada.clienteNome}</span>}
              </span>
              <span className="text-muted-foreground text-xs shrink-0">{formatDate(entrada.createdAt)}</span>
            </button>
          ))}
        </div>
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        totalItems={total}
        itemsMostrados={entradas.length}
        itemLabel="movimentações"
        onPageChange={setPage}
        onPageSizeChange={(novoTamanho) => {
          setPageSize(novoTamanho)
          setPage(1)
        }}
      />
    </div>
  )
}
