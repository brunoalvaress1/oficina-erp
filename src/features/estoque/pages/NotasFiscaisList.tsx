import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotasFiscais } from '../hooks/useNotasFiscais'
import { Pagination } from '@/components/ui/Pagination'
import { formatCurrency, formatDate } from '@/utils/format'

export function NotasFiscaisList() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [busca, setBusca] = useState('')

  const { data, isLoading } = useNotasFiscais({ page, pageSize, search: busca })
  const notas = data?.data ?? []
  const total = data?.total ?? 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Editar Nota Fiscal</h1>
        <button type="button" onClick={() => navigate('/estoque')} className="h-9 px-4 rounded-md border text-sm font-medium">
          Voltar
        </button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="p-3 border-b bg-muted/20">
          <input
            type="text"
            value={busca}
            onChange={(event) => {
              setBusca(event.target.value)
              setPage(1)
            }}
            placeholder="Pesquisar nota por número..."
            className="w-full h-9 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-4 py-2">Nota</th>
              <th className="text-left font-medium px-4 py-2">Fornecedor</th>
              <th className="text-left font-medium px-4 py-2">Data da Nota</th>
              <th className="text-left font-medium px-4 py-2">Valor</th>
              <th className="text-left font-medium px-4 py-2">Criada por</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            )}
            {!isLoading && notas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  Nenhuma nota fiscal encontrada
                </td>
              </tr>
            )}
            {notas.map((nota) => (
              <tr
                key={nota.id}
                className="border-t hover:bg-muted/20 cursor-pointer"
                onClick={() => navigate(`/estoque/notas/${nota.id}`)}
              >
                <td className="px-4 py-2 font-medium">{nota.numeroNota}</td>
                <td className="px-4 py-2">{nota.fornecedorNome ?? '-'}</td>
                <td className="px-4 py-2">{formatDate(nota.dataNota)}</td>
                <td className="px-4 py-2">{formatCurrency(nota.valorProdutos)}</td>
                <td className="px-4 py-2">{nota.criadoPorNome ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        totalItems={total}
        itemsMostrados={notas.length}
        itemLabel="notas"
        onPageChange={setPage}
        onPageSizeChange={(novoTamanho) => {
          setPageSize(novoTamanho)
          setPage(1)
        }}
      />
    </div>
  )
}
