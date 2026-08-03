import { useState } from 'react'
import { Pagination } from '@/components/ui/Pagination'
import { useHistoricoFinanceiro } from '../hooks/useAuditoriaFinanceira'
import { ROTULO_ENTIDADE_FINANCEIRA, type EntidadeFinanceira } from '../types/auditoriaFinanceira'

const ENTIDADES: EntidadeFinanceira[] = ['conta_receber', 'conta_pagar', 'transferencia', 'movimentacao', 'meta']

const ROTULO_ACAO: Record<string, string> = {
  criado: 'Criado',
  baixa: 'Baixa registrada',
  cancelado: 'Cancelado',
  conciliado: 'Conciliado',
  definido: 'Meta definida',
}

export function AuditoriaFinanceira() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(30)
  const [entidade, setEntidade] = useState<EntidadeFinanceira | ''>('')

  const { data, isLoading } = useHistoricoFinanceiro({ page, pageSize, entidade: entidade || undefined })
  const entradas = data?.data ?? []
  const total = data?.total ?? 0

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Auditoria</h1>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setEntidade('')
            setPage(1)
          }}
          className={`h-8 px-3 rounded-full text-xs font-medium border ${entidade === '' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background'}`}
        >
          Todas
        </button>
        {ENTIDADES.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => {
              setEntidade(e)
              setPage(1)
            }}
            className={`h-8 px-3 rounded-full text-xs font-medium border ${entidade === e ? 'bg-primary text-primary-foreground border-primary' : 'bg-background'}`}
          >
            {ROTULO_ENTIDADE_FINANCEIRA[e]}
          </button>
        ))}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-3 py-2">Data/Hora</th>
              <th className="text-left font-medium px-3 py-2">Usuário</th>
              <th className="text-left font-medium px-3 py-2">Entidade</th>
              <th className="text-left font-medium px-3 py-2">Ação</th>
              <th className="text-left font-medium px-3 py-2">Detalhes</th>
              <th className="text-left font-medium px-3 py-2">IP</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            )}
            {!isLoading && entradas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                  Nenhum registro
                </td>
              </tr>
            )}
            {entradas.map((entrada) => (
              <tr key={entrada.id} className="border-t align-top">
                <td className="px-3 py-2 whitespace-nowrap">{new Date(entrada.createdAt).toLocaleString('pt-BR')}</td>
                <td className="px-3 py-2">{entrada.funcionarioNome ?? '-'}</td>
                <td className="px-3 py-2">{ROTULO_ENTIDADE_FINANCEIRA[entrada.entidade]}</td>
                <td className="px-3 py-2">{ROTULO_ACAO[entrada.acao] ?? entrada.acao}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground max-w-xs truncate" title={JSON.stringify(entrada.detalhes)}>
                  {JSON.stringify(entrada.detalhes)}
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{entrada.ip ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        totalItems={total}
        itemsMostrados={entradas.length}
        itemLabel="registros"
        onPageChange={setPage}
        onPageSizeChange={(novoTamanho) => {
          setPageSize(novoTamanho)
          setPage(1)
        }}
      />
    </div>
  )
}
