import { useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { Download, FileSpreadsheet, FileText, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/utils/format'
import { exportarCsv, exportarExcel, imprimirTabela, type ColunaExport } from '@/features/financeiro/services/exportService'
import { criarFiltroFinanceiroPadrao } from '@/features/financeiro/types/filtroFinanceiro'
import { FiltroPeriodo } from '../components/FiltroPeriodo'
import { useLucroPecas } from '../hooks/useRelatorioLucro'
import type { LucroPeca } from '../types/relatorioLucro'

const ROTULO_TIPO: Record<LucroPeca['tipo'], string> = {
  produto_estoque: 'Estoque próprio',
  produto_terceirizado: 'Terceirizada',
}

const COLUNAS_EXPORT: ColunaExport<LucroPeca>[] = [
  { chave: 'descricao', titulo: 'Peça', valor: (p) => p.descricao },
  { chave: 'tipo', titulo: 'Origem', valor: (p) => ROTULO_TIPO[p.tipo] },
  { chave: 'quantidade', titulo: 'Quantidade', valor: (p) => p.quantidade },
  { chave: 'valorVendido', titulo: 'Valor Vendido', valor: (p) => p.valorVendido },
  { chave: 'custoTotal', titulo: 'Custo Total', valor: (p) => p.custoTotal },
  { chave: 'lucro', titulo: 'Lucro', valor: (p) => p.lucro },
  { chave: 'margemPercentual', titulo: 'Margem %', valor: (p) => p.margemPercentual },
]

export function RelatorioLucroPecas() {
  const [filtro, setFiltro] = useState(criarFiltroFinanceiroPadrao())
  const [busca, setBusca] = useState('')
  const [buscaDebounced, setBuscaDebounced] = useState('')

  const aplicarBusca = useDebouncedCallback((valor: string) => setBuscaDebounced(valor), 300)

  const { data, isLoading } = useLucroPecas(filtro.dataInicio, filtro.dataFim)
  const linhas = (data ?? []).filter((p) => p.descricao.toLowerCase().includes(buscaDebounced.toLowerCase()))

  const totalVendido = linhas.reduce((soma, p) => soma + p.valorVendido, 0)
  const totalCusto = linhas.reduce((soma, p) => soma + p.custoTotal, 0)
  const totalLucro = linhas.reduce((soma, p) => soma + p.lucro, 0)
  const margemMedia = totalVendido > 0 ? (totalLucro / totalVendido) * 100 : 0

  async function handleExportarExcel() {
    try {
      await exportarExcel(linhas, COLUNAS_EXPORT, 'lucro-pecas')
    } catch (error) {
      toast.error('Erro ao exportar Excel', { description: error instanceof Error ? error.message : String(error) })
    }
  }

  async function handleExportarPdf() {
    try {
      const { gerarEBaixarPdfLucroPecas } = await import('../components/DocumentoLucroPecasPdf')
      await gerarEBaixarPdfLucroPecas(
        linhas,
        { valorVendido: totalVendido, custoTotal: totalCusto, lucro: totalLucro, margemMedia },
        filtro.dataInicio,
        filtro.dataFim,
      )
    } catch (error) {
      toast.error('Erro ao gerar PDF', { description: error instanceof Error ? error.message : String(error) })
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Relatório de Lucro em Peças</h1>

      <FiltroPeriodo periodo={filtro.periodo} dataInicio={filtro.dataInicio} dataFim={filtro.dataFim} onChange={(v) => setFiltro((f) => ({ ...f, ...v }))} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg border p-4">
          <span className="text-xs text-muted-foreground">Valor Vendido</span>
          <p className="text-lg font-semibold">{formatCurrency(totalVendido)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <span className="text-xs text-muted-foreground">Custo Total</span>
          <p className="text-lg font-semibold">{formatCurrency(totalCusto)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <span className="text-xs text-muted-foreground">Lucro</span>
          <p className="text-lg font-semibold text-emerald-600">{formatCurrency(totalLucro)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <span className="text-xs text-muted-foreground">Margem Média</span>
          <p className="text-lg font-semibold">{margemMedia.toFixed(1)}%</p>
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
            placeholder="Buscar peça..."
            className="h-9 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30 flex-1 min-w-48"
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => exportarCsv(linhas, COLUNAS_EXPORT, 'lucro-pecas')} className="h-9 px-3 rounded-md border text-sm font-medium flex items-center gap-1.5">
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
              onClick={() => imprimirTabela(linhas, COLUNAS_EXPORT, 'Relatório de Lucro em Peças')}
              className="h-9 px-3 rounded-md border text-sm font-medium flex items-center gap-1.5"
            >
              <Printer size={14} /> Imprimir
            </button>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-3 py-2">Peça</th>
              <th className="text-left font-medium px-3 py-2">Origem</th>
              <th className="text-right font-medium px-3 py-2">Qtd.</th>
              <th className="text-right font-medium px-3 py-2">Vendido</th>
              <th className="text-right font-medium px-3 py-2">Custo</th>
              <th className="text-right font-medium px-3 py-2">Lucro</th>
              <th className="text-right font-medium px-3 py-2">Margem</th>
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
            {!isLoading && linhas.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                  Nenhuma peça vendida no período
                </td>
              </tr>
            )}
            {linhas.map((peca, indice) => (
              <tr key={`${peca.produtoId ?? peca.descricao}-${indice}`} className="border-t hover:bg-muted/20">
                <td className="px-3 py-2">{peca.descricao}</td>
                <td className="px-3 py-2 text-muted-foreground">{ROTULO_TIPO[peca.tipo]}</td>
                <td className="px-3 py-2 text-right">{peca.quantidade}</td>
                <td className="px-3 py-2 text-right">{formatCurrency(peca.valorVendido)}</td>
                <td className="px-3 py-2 text-right">{formatCurrency(peca.custoTotal)}</td>
                <td className="px-3 py-2 text-right font-medium text-emerald-600">{formatCurrency(peca.lucro)}</td>
                <td className="px-3 py-2 text-right">{peca.margemPercentual.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
