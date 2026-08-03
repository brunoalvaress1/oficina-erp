import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useItensRecusados } from '../hooks/useItensRecusados'
import { Pagination } from '@/components/ui/Pagination'
import { formatCurrency, formatDate } from '@/utils/format'

export function ItensRecusados() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [busca, setBusca] = useState('')

  const { data, isLoading } = useItensRecusados({ page, pageSize, search: busca })
  const itens = data?.data ?? []
  const total = data?.total ?? 0

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Itens Recusados</h1>

      <div className="border rounded-lg overflow-hidden">
        <div className="p-3 border-b bg-muted/20">
          <input
            type="text"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value)
              setPage(1)
            }}
            placeholder="Buscar por descrição do item..."
            className="w-full h-9 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-3 py-2">Descrição</th>
              <th className="text-right font-medium px-3 py-2">Qtd.</th>
              <th className="text-right font-medium px-3 py-2">Valor Unit.</th>
              <th className="text-right font-medium px-3 py-2">Total</th>
              <th className="text-left font-medium px-3 py-2">OS</th>
              <th className="text-left font-medium px-3 py-2">Cliente</th>
              <th className="text-left font-medium px-3 py-2">Placa</th>
              <th className="text-left font-medium px-3 py-2">Data</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            )}
            {!isLoading && total === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">
                  Nenhum item recusado
                </td>
              </tr>
            )}
            {itens.map((item) => (
              <tr
                key={item.id}
                className="border-t hover:bg-muted/20 cursor-pointer"
                onClick={() => navigate(`/ordens/${item.ordemServicoId}`)}
              >
                <td className="px-3 py-2">{item.descricao}</td>
                <td className="px-3 py-2 text-right">{item.quantidade}</td>
                <td className="px-3 py-2 text-right">{formatCurrency(item.valorUnitario)}</td>
                <td className="px-3 py-2 text-right font-medium">{formatCurrency(item.valorTotal)}</td>
                <td className="px-3 py-2">nº {item.ordemServicoNumero}</td>
                <td className="px-3 py-2">{item.clienteNome ?? '-'}</td>
                <td className="px-3 py-2">{item.veiculoPlaca ?? '-'}</td>
                <td className="px-3 py-2">{formatDate(item.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        totalItems={total}
        itemsMostrados={itens.length}
        itemLabel="itens"
        onPageChange={setPage}
        onPageSizeChange={(novoTamanho) => {
          setPageSize(novoTamanho)
          setPage(1)
        }}
      />
    </div>
  )
}
