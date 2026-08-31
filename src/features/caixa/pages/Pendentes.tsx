import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DollarSign, Lock } from 'lucide-react'
import { useCaixaLancamentos } from '../hooks/useCaixaLancamentos'
import { ReceberPagamentoModal } from '../components/ReceberPagamentoModal'
import { PermissionGate } from '../components/PermissionGate'
import { useSessaoCaixaAberta } from '../hooks/useCaixaSessao'
import { Pagination } from '@/components/ui/Pagination'
import { formatCurrency, formatDate } from '@/utils/format'
import type { CaixaLancamento } from '../types/caixa'

function diasEmAtraso(dataAtualizacao: string): number {
  const diffMs = Date.now() - new Date(dataAtualizacao).getTime()
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

export function Pendentes() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [lancamentoParaReceber, setLancamentoParaReceber] = useState<CaixaLancamento | null>(null)

  const { data: sessaoAberta, isLoading: carregandoSessao } = useSessaoCaixaAberta()
  const { data, isLoading } = useCaixaLancamentos({ page, pageSize, filtro: 'pendente' })
  const lancamentos = data?.data ?? []
  const total = data?.total ?? 0

  if (carregandoSessao) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }

  if (!sessaoAberta) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Pendentes</h1>
        <div className="rounded-lg border p-10 flex flex-col items-center justify-center gap-4 text-center">
          <Lock size={32} className="text-muted-foreground" />
          <div>
            <p className="font-medium">O caixa está fechado</p>
            <p className="text-sm text-muted-foreground">Abra o caixa para ver e receber os pendentes.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/caixa')}
            className="flex items-center gap-2 h-10 px-5 rounded-md bg-primary text-primary-foreground text-sm font-medium"
          >
            Ir para o Caixa
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Pendentes</h1>

      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-3 py-2">OS</th>
              <th className="text-left font-medium px-3 py-2">Cliente</th>
              <th className="text-left font-medium px-3 py-2">Telefone</th>
              <th className="text-left font-medium px-3 py-2">Veículo</th>
              <th className="text-left font-medium px-3 py-2">Placa</th>
              <th className="text-right font-medium px-3 py-2">Valor</th>
              <th className="text-left font-medium px-3 py-2">Data</th>
              <th className="text-left font-medium px-3 py-2">Dias em Atraso</th>
              <th className="text-left font-medium px-3 py-2">Responsável</th>
              <th className="text-left font-medium px-3 py-2">Observações</th>
              <th className="text-right font-medium px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={11} className="px-3 py-6 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            )}
            {!isLoading && total === 0 && (
              <tr>
                <td colSpan={11} className="px-3 py-6 text-center text-muted-foreground">
                  Nenhum pendente
                </td>
              </tr>
            )}
            {lancamentos.map((lancamento) => (
              <tr key={lancamento.id} className="border-t hover:bg-muted/20">
                <td className="px-3 py-2 font-medium">OS {lancamento.ordemNumero}</td>
                <td className="px-3 py-2">{lancamento.clienteNome ?? '-'}</td>
                <td className="px-3 py-2">{lancamento.clienteTelefone ?? '-'}</td>
                <td className="px-3 py-2">{lancamento.veiculoModelo ?? '-'}</td>
                <td className="px-3 py-2">{lancamento.veiculoPlaca ?? '-'}</td>
                <td className="px-3 py-2 text-right font-medium">
                  {formatCurrency(lancamento.valorTotal - lancamento.valorRecebidoAcumulado)}
                  {lancamento.valorRecebidoAcumulado > 0 && (
                    <span className="block text-xs font-normal text-muted-foreground">
                      de {formatCurrency(lancamento.valorTotal)} · {formatCurrency(lancamento.valorRecebidoAcumulado)} já recebido
                    </span>
                  )}
                </td>
                <td className="px-3 py-2">{formatDate(lancamento.dataAbertura)}</td>
                <td className="px-3 py-2">{diasEmAtraso(lancamento.updatedAt)} dia(s)</td>
                <td className="px-3 py-2">{lancamento.responsavelNome ?? '-'}</td>
                <td className="px-3 py-2">{lancamento.observacoes ?? '-'}</td>
                <td className="px-3 py-2 text-right">
                  <PermissionGate codigo="caixa.receber">
                    <button
                      type="button"
                      onClick={() => setLancamentoParaReceber(lancamento)}
                      className="flex items-center gap-1 h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium ml-auto"
                    >
                      <DollarSign size={13} /> Receber
                    </button>
                  </PermissionGate>
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
        itemsMostrados={lancamentos.length}
        itemLabel="pendentes"
        onPageChange={setPage}
        onPageSizeChange={(novoTamanho) => {
          setPageSize(novoTamanho)
          setPage(1)
        }}
      />

      {lancamentoParaReceber && (
        <ReceberPagamentoModal
          lancamento={lancamentoParaReceber}
          open={!!lancamentoParaReceber}
          onOpenChange={(open) => !open && setLancamentoParaReceber(null)}
        />
      )}
    </div>
  )
}
