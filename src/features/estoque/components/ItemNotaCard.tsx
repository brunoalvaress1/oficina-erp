import { useState } from 'react'
import { ChevronDown, ChevronUp, Copy, Trash2 } from 'lucide-react'
import { Combobox } from '@/components/ui/Combobox'
import { useProdutosBusca } from '@/features/produtos/hooks/useProdutosBusca'
import { formatCurrency } from '@/utils/format'
import { calcularCustoMedio, calcularMargem, criarItemVazio, itemEstaCompleto, type ItemEstoqueForm } from '../types/itemForm'
import type { Produto } from '@/features/produtos/types/produto'

interface ItemNotaCardProps {
  item: ItemEstoqueForm
  indice: number
  tentouSalvar: boolean
  podeVerLucro: boolean
  onChange: (item: ItemEstoqueForm) => void
  onDuplicar: () => void
  onRemover: () => void
}

export function ItemNotaCard({ item, indice, tentouSalvar, podeVerLucro, onChange, onDuplicar, onRemover }: ItemNotaCardProps) {
  const [termoBusca, setTermoBusca] = useState('')
  const { data: produtosEncontrados = [], isLoading: buscandoProdutos } = useProdutosBusca(termoBusca)

  const quantidade = Number(item.quantidade) || 0
  const total = quantidade * (Number(item.valorCustoAtual) || 0)
  const custoMedioResultante = calcularCustoMedio(item)
  const margemOs = calcularMargem(item.valorVendaOs, item.valorCustoAtual)
  const completo = itemEstaCompleto(item)

  function atualizar(campo: keyof ItemEstoqueForm, valor: string | boolean) {
    onChange({ ...item, [campo]: valor })
  }

  function selecionarProduto(produto: Produto) {
    const base = criarItemVazio(produto)
    onChange({ ...base, chave: item.chave, mostrarFiscais: item.mostrarFiscais })
  }

  const erroDestaque = 'border-destructive focus:ring-destructive/40'
  const okClasse = 'focus:ring-primary/30'

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="bg-foreground text-background px-4 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium truncate">
            {item.produto ? item.produto.nome : `Produto ${indice + 1}`}
          </span>
          {quantidade > 0 && (
            <span className="text-xs opacity-80 shrink-0">
              {quantidade} un · {formatCurrency(total)}
            </span>
          )}
          {!completo && tentouSalvar && (
            <span className="text-xs text-destructive-foreground bg-destructive rounded px-1.5 py-0.5 shrink-0">
              incompleto
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onDuplicar}
            title="Duplicar produto"
            className="p-1.5 rounded hover:bg-white/10"
          >
            <Copy size={15} />
          </button>
          <button
            type="button"
            onClick={onRemover}
            title="Remover produto"
            className="p-1.5 rounded hover:bg-white/10"
          >
            <Trash2 size={15} />
          </button>
          <button
            type="button"
            onClick={() => atualizar('mostrarFiscais', !item.mostrarFiscais)}
            title="Expandir/recolher"
            className="p-1.5 rounded hover:bg-white/10"
          >
            {item.mostrarFiscais ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Produto (nome, código ou código de barras) *</label>
          <Combobox<Produto>
            value={item.produto}
            onSelect={selecionarProduto}
            onSearch={setTermoBusca}
            items={produtosEncontrados}
            isLoading={buscandoProdutos}
            getKey={(p) => p.id}
            getLabel={(p) => p.nome}
            getDescription={(p) =>
              [p.codigoInterno || p.codigoFabricante, `estoque atual: ${p.estoqueFisico}`].filter(Boolean).join(' · ')
            }
            placeholder="Digite para buscar um produto..."
            emptyMessage="Nenhum produto encontrado"
          />
          {tentouSalvar && !item.produto && <p className="text-xs text-destructive">Selecione um produto</p>}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Quantidade *</label>
            <input
              type="number"
              min={1}
              value={item.quantidade}
              onChange={(e) => atualizar('quantidade', e.target.value)}
              className={`w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 ${
                tentouSalvar && !(quantidade > 0) ? erroDestaque : okClasse
              }`}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Valor Custo Atual *</label>
            <input
              type="number"
              step="0.01"
              value={item.valorCustoAtual}
              onChange={(e) => atualizar('valorCustoAtual', e.target.value)}
              className={`w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 ${
                tentouSalvar && !(Number(item.valorCustoAtual) > 0) ? erroDestaque : okClasse
              }`}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Valor Venda (O.S.) *</label>
            <input
              type="number"
              step="0.01"
              value={item.valorVendaOs}
              onChange={(e) => atualizar('valorVendaOs', e.target.value)}
              className={`w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 ${
                tentouSalvar && !(Number(item.valorVendaOs) > 0) ? erroDestaque : okClasse
              }`}
            />
          </div>
        </div>

        {item.produto && (
          <div className="rounded-md bg-muted/40 p-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Custo anterior</p>
              <p className="font-medium">{formatCurrency(item.produto.custoMedio || item.produto.valorCusto)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Custo médio (após lançar)</p>
              <p className="font-medium">{custoMedioResultante !== null ? formatCurrency(custoMedioResultante) : '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Estoque atual → resultante</p>
              <p className="font-medium">
                {item.produto.estoqueFisico} → {item.produto.estoqueFisico + quantidade}
              </p>
            </div>
            {podeVerLucro && (
              <div>
                <p className="text-muted-foreground text-xs">Margem de lucro (O.S.)</p>
                <p className="font-medium">{margemOs !== null ? `${margemOs.toFixed(0)}%` : '-'}</p>
              </div>
            )}
          </div>
        )}

        {item.mostrarFiscais && (
          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Informações fiscais (opcional)</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <CampoOpcional label="NCM" value={item.ncm} onChange={(v) => atualizar('ncm', v)} />
              <CampoOpcional label="CEST" value={item.cest} onChange={(v) => atualizar('cest', v)} />
              <CampoOpcional label="CFOP" value={item.cfop} onChange={(v) => atualizar('cfop', v)} />
              <CampoOpcional label="Classe de Imposto" value={item.classeImposto} onChange={(v) => atualizar('classeImposto', v)} />
              <CampoOpcional label="Origem" value={item.origem} onChange={(v) => atualizar('origem', v)} />
              <CampoOpcional label="Situação Tributária" value={item.situacaoTributaria} onChange={(v) => atualizar('situacaoTributaria', v)} />
              <CampoOpcional label="CST PIS/COFINS" value={item.cstPisCofins} onChange={(v) => atualizar('cstPisCofins', v)} />
              <CampoOpcional label="CST IPI" value={item.cstIpi} onChange={(v) => atualizar('cstIpi', v)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Observações</label>
              <textarea
                value={item.observacoes}
                onChange={(e) => atualizar('observacoes', e.target.value)}
                rows={2}
                className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CampoOpcional({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  )
}
