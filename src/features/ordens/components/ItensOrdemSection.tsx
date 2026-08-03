import { useState } from 'react'
import { Trash2, Pencil, Check, X } from 'lucide-react'
import { ItemOrdemRowNovo } from './ItemOrdemRow'
import { CampoMoeda } from '@/components/ui/CampoMoeda'
import { formatCurrency } from '@/utils/format'
import type { StatusAprovacaoItem, TipoItemOrdem } from '../types/ordemServico'
import type { ItemOrdemForm, ItemExibicao } from '../types/itemOrdemForm'

export type { ItemExibicao }

const ROTULO_TIPO: Record<TipoItemOrdem, string> = {
  produto_estoque: 'Produto',
  produto_terceirizado: 'Terceirizado',
  servico: 'Serviço',
}

const BADGE_APROVACAO: Record<StatusAprovacaoItem, string> = {
  aguardando: 'bg-amber-100 text-amber-700',
  aprovado: 'bg-green-100 text-green-700',
  recusado: 'bg-red-100 text-red-700',
}

const ROTULO_APROVACAO: Record<StatusAprovacaoItem, string> = {
  aguardando: 'Aguardando',
  aprovado: 'Aprovado',
  recusado: 'Recusado',
}

export interface AlteracoesItem {
  quantidade: number
  valorUnitario: number
  valorDesconto: number
}

interface EdicaoEmAndamento {
  chave: string
  quantidade: string
  valorUnitario: string
  valorDesconto: string
}

interface ItensOrdemSectionProps {
  itens: ItemExibicao[]
  podeVerLucro: boolean
  somenteLeitura: boolean
  onAdicionar: (item: ItemOrdemForm) => void
  onEditar: (chave: string, alteracoes: AlteracoesItem) => void
  onRemover: (chave: string) => void
  adicionando?: boolean
  editando?: boolean
}

export function ItensOrdemSection({
  itens,
  podeVerLucro,
  somenteLeitura,
  onAdicionar,
  onEditar,
  onRemover,
  adicionando,
  editando,
}: ItensOrdemSectionProps) {
  const [edicao, setEdicao] = useState<EdicaoEmAndamento | null>(null)

  function calcularMargem(item: ItemExibicao): number | null {
    if (!item.valorCusto) return null
    return ((item.valorUnitario - item.valorCusto) / item.valorCusto) * 100
  }

  function iniciarEdicao(item: ItemExibicao) {
    setEdicao({
      chave: item.chave,
      quantidade: String(item.quantidade),
      valorUnitario: String(item.valorUnitario),
      valorDesconto: String(item.valorDesconto),
    })
  }

  function salvarEdicao() {
    if (!edicao) return
    onEditar(edicao.chave, {
      quantidade: Number(edicao.quantidade) || 0,
      valorUnitario: Number(edicao.valorUnitario) || 0,
      valorDesconto: Number(edicao.valorDesconto) || 0,
    })
    setEdicao(null)
  }

  return (
    <div className="space-y-3">
      <h2 className="font-medium">Produtos e Serviços</h2>

      {!somenteLeitura && <ItemOrdemRowNovo onAdicionar={onAdicionar} adicionando={adicionando} />}

      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-3 py-2">Descrição</th>
              <th className="text-left font-medium px-3 py-2">Tipo</th>
              <th className="text-right font-medium px-3 py-2">Qtd.</th>
              <th className="text-right font-medium px-3 py-2">Valor Unit.</th>
              <th className="text-right font-medium px-3 py-2">Desconto</th>
              <th className="text-right font-medium px-3 py-2">Total</th>
              <th className="text-left font-medium px-3 py-2">Fornecedor</th>
              <th className="text-left font-medium px-3 py-2">NF</th>
              {podeVerLucro && <th className="text-right font-medium px-3 py-2">Lucro</th>}
              <th className="text-left font-medium px-3 py-2">Aprovação</th>
              {!somenteLeitura && <th className="text-right font-medium px-3 py-2">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {itens.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-6 text-center text-muted-foreground">
                  Nenhum item adicionado ainda
                </td>
              </tr>
            )}
            {itens.map((item) => {
              const margem = calcularMargem(item)
              const emEdicao = edicao?.chave === item.chave

              return (
                <tr key={item.chave} className="border-t">
                  <td className="px-3 py-2">{item.descricao}</td>
                  <td className="px-3 py-2 text-muted-foreground">{ROTULO_TIPO[item.tipo]}</td>

                  {emEdicao ? (
                    <>
                      <td className="px-3 py-2">
                        <input
                          value={edicao.quantidade}
                          onChange={(e) => setEdicao({ ...edicao, quantidade: e.target.value.replace(/[^0-9.]/g, '') })}
                          inputMode="decimal"
                          className="w-20 h-8 rounded-md border bg-transparent px-2 text-sm text-right outline-none focus:ring-1 focus:ring-primary/30"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <CampoMoeda
                          value={edicao.valorUnitario}
                          onChange={(v) => setEdicao({ ...edicao, valorUnitario: v })}
                          className="w-24 h-8 rounded-md border bg-transparent px-2 text-sm text-right outline-none focus:ring-1 focus:ring-primary/30"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <CampoMoeda
                          value={edicao.valorDesconto}
                          onChange={(v) => setEdicao({ ...edicao, valorDesconto: v })}
                          className="w-20 h-8 rounded-md border bg-transparent px-2 text-sm text-right outline-none focus:ring-1 focus:ring-primary/30"
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        {formatCurrency(
                          (Number(edicao.quantidade) || 0) * (Number(edicao.valorUnitario) || 0) -
                            (Number(edicao.valorDesconto) || 0),
                        )}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2 text-right">{item.quantidade}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(item.valorUnitario)}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(item.valorDesconto)}</td>
                      <td className="px-3 py-2 text-right font-medium">{formatCurrency(item.valorTotal)}</td>
                    </>
                  )}

                  <td className="px-3 py-2">{item.fornecedorNome ?? '-'}</td>
                  <td className="px-3 py-2">{item.numeroNota ?? '-'}</td>
                  {podeVerLucro && (
                    <td className="px-3 py-2 text-right">{margem != null ? `${margem.toFixed(0)}%` : '-'}</td>
                  )}
                  <td className="px-3 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${BADGE_APROVACAO[item.statusAprovacao]}`}>
                      {ROTULO_APROVACAO[item.statusAprovacao]}
                    </span>
                  </td>
                  {!somenteLeitura && (
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        {emEdicao ? (
                          <>
                            <button
                              type="button"
                              onClick={salvarEdicao}
                              disabled={editando}
                              className="p-1.5 rounded hover:bg-muted text-green-600 disabled:opacity-50"
                            >
                              <Check size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEdicao(null)}
                              className="p-1.5 rounded hover:bg-muted text-muted-foreground"
                            >
                              <X size={15} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => iniciarEdicao(item)}
                              className="p-1.5 rounded hover:bg-muted"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onRemover(item.chave)}
                              className="p-1.5 rounded hover:bg-muted text-destructive"
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
