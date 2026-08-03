import { useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { Download, FileSpreadsheet, FileText, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/utils/format'
import { exportarCsv, exportarExcel, imprimirTabela, type ColunaExport } from '@/features/financeiro/services/exportService'
import { criarFiltroFinanceiroPadrao } from '@/features/financeiro/types/filtroFinanceiro'
import { FiltroPeriodo } from '../components/FiltroPeriodo'
import { useLucroServicos } from '../hooks/useRelatorioLucro'
import type { LucroServico } from '../types/relatorioLucro'

const COLUNAS_EXPORT: ColunaExport<LucroServico>[] = [
  { chave: 'descricao', titulo: 'Serviço', valor: (s) => s.descricao },
  { chave: 'quantidade', titulo: 'Quantidade', valor: (s) => s.quantidade },
  { chave: 'valorVendido', titulo: 'Valor Vendido', valor: (s) => s.valorVendido },
  { chave: 'lucro', titulo: 'Lucro', valor: (s) => s.lucro },
]

export function RelatorioLucroServicos() {
  const [filtro, setFiltro] = useState(criarFiltroFinanceiroPadrao())
  const [busca, setBusca] = useState('')
  const [buscaDebounced, setBuscaDebounced] = useState('')

  const aplicarBusca = useDebouncedCallback((valor: string) => setBuscaDebounced(valor), 300)

  const { data, isLoading } = useLucroServicos(filtro.dataInicio, filtro.dataFim)
  const linhas = (data ?? []).filter((s) => s.descricao.toLowerCase().includes(buscaDebounced.toLowerCase()))

  const totalVendido = linhas.reduce((soma, s) => soma + s.valorVendido, 0)
  const totalLucro = linhas.reduce((soma, s) => soma + s.lucro, 0)
  const totalQuantidade = linhas.reduce((soma, s) => soma + s.quantidade, 0)

  async function handleExportarExcel() {
    try {
      await exportarExcel(linhas, COLUNAS_EXPORT, 'lucro-servicos')
    } catch (error) {
      toast.error('Erro ao exportar Excel', { description: error instanceof Error ? error.message : String(error) })
    }
  }

  async function handleExportarPdf() {
    try {
      const { gerarEBaixarPdfLucroServicos } = await import('../components/DocumentoLucroServicosPdf')
      await gerarEBaixarPdfLucroServicos(
        linhas,
        { quantidade: totalQuantidade, valorVendido: totalVendido, lucro: totalLucro },
        filtro.dataInicio,
        filtro.dataFim,
      )
    } catch (error) {
      toast.error('Erro ao gerar PDF', { description: error instanceof Error ? error.message : String(error) })
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Relatório de Lucro em Serviços</h1>

      <FiltroPeriodo periodo={filtro.periodo} dataInicio={filtro.dataInicio} dataFim={filtro.dataFim} onChange={(v) => setFiltro((f) => ({ ...f, ...v }))} />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="rounded-lg border p-4">
          <span className="text-xs text-muted-foreground">Serviços Realizados</span>
          <p className="text-lg font-semibold">{totalQuantidade}</p>
        </div>
        <div className="rounded-lg border p-4">
          <span className="text-xs text-muted-foreground">Valor Vendido</span>
          <p className="text-lg font-semibold">{formatCurrency(totalVendido)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <span className="text-xs text-muted-foreground">Lucro (100%)</span>
          <p className="text-lg font-semibold text-emerald-600">{formatCurrency(totalLucro)}</p>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="p-3 border-b bg-muted/20 flex flex-wrap items-center gap-2 justify-between">
          <input
            type="text"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value)
              aplicarBusca(e.target.value)
            }}
            placeholder="Buscar serviço..."
            className="h-9 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30 flex-1 min-w-48"
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => exportarCsv(linhas, COLUNAS_EXPORT, 'lucro-servicos')} className="h-9 px-3 rounded-md border text-sm font-medium flex items-center gap-1.5">
              <Download size={14} /> CSV
            </button>
            <button type="button" onClick={handleExportarExcel} className="h-9 px-3 rounded-md border text-sm font-medium flex items-center gap-1.5">
              <FileSpreadsheet size={14} /> Excel
            </button>
            <button type="button" onClick={handleExportarPdf} className="h-9 px-3 rounded-md border text-sm font-medium flex items-center gap-1.5">
              <FileText size={14} /> PDF
            </button>
            <button
              type="button"
              onClick={() => imprimirTabela(linhas, COLUNAS_EXPORT, 'Relatório de Lucro em Serviços')}
              className="h-9 px-3 rounded-md border text-sm font-medium flex items-center gap-1.5"
            >
              <Printer size={14} /> Imprimir
            </button>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-3 py-2">Serviço</th>
              <th className="text-right font-medium px-3 py-2">Qtd.</th>
              <th className="text-right font-medium px-3 py-2">Vendido</th>
              <th className="text-right font-medium px-3 py-2">Lucro</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            )}
            {!isLoading && linhas.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                  Nenhum serviço realizado no período
                </td>
              </tr>
            )}
            {linhas.map((servico, indice) => (
              <tr key={`${servico.servicoId ?? servico.descricao}-${indice}`} className="border-t hover:bg-muted/20">
                <td className="px-3 py-2">{servico.descricao}</td>
                <td className="px-3 py-2 text-right">{servico.quantidade}</td>
                <td className="px-3 py-2 text-right">{formatCurrency(servico.valorVendido)}</td>
                <td className="px-3 py-2 text-right font-medium text-emerald-600">{formatCurrency(servico.lucro)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
