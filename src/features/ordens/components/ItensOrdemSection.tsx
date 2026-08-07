import { useState } from 'react'
import { Trash2, Pencil, Check, X, Package } from 'lucide-react'
import { ItemOrdemRowNovo } from './ItemOrdemRow'
import { CampoDesconto } from './CampoDesconto'
import { CampoMoeda } from '@/components/ui/CampoMoeda'
import { Combobox } from '@/components/ui/Combobox'
import { useFornecedoresSelect } from '@/features/fornecedores/hooks/useFornecedoresSelect'
import { capitalizarPalavras, formatCurrency } from '@/utils/format'
import type { StatusAprovacaoItem, TipoItemOrdem } from '../types/ordemServico'
import type { ItemOrdemForm, ItemExibicao } from '../types/itemOrdemForm'
import type { FornecedorSelect } from '@/features/fornecedores/types/fornecedor'

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
  descricao: string
  quantidade: number
  valorUnitario: number
  valorDesconto: number
  valorCusto?: number
  numeroNota?: string
  fornecedor?: FornecedorSelect | null
}

interface EdicaoEmAndamento {
  chave: string
  tipo: TipoItemOrdem
  descricao: string
  quantidade: string
  valorUnitario: string
  valorDesconto: string
  valorCusto: string
  numeroNota: string
  fornecedor: FornecedorSelect | null
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
  const [termoBuscaFornecedor, setTermoBuscaFornecedor] = useState('')
  const { data: fornecedoresEncontrados = [], isLoading: buscandoFornecedores } = useFornecedoresSelect(
    edicao?.tipo === 'produto_terceirizado' ? termoBuscaFornecedor : '',
  )

  function calcularMargem(item: ItemExibicao): number | null {
    if (!item.valorCusto) return null
    return ((item.valorUnitario - item.valorCusto) / item.valorCusto) * 100
  }

  function iniciarEdicao(item: ItemExibicao) {
    setEdicao({
      chave: item.chave,
      tipo: item.tipo,
      descricao: item.descricao,
      quantidade: String(item.quantidade),
      valorUnitario: String(item.valorUnitario),
      valorDesconto: String(item.valorDesconto),
      valorCusto: item.valorCusto != null ? String(item.valorCusto) : '',
      numeroNota: item.numeroNota ?? '',
      fornecedor: item.fornecedorId ? { id: item.fornecedorId, nome: item.fornecedorNome ?? '', cnpjCpf: null } : null,
    })
  }

  function salvarEdicao() {
    if (!edicao) return
    onEditar(edicao.chave, {
      descricao: capitalizarPalavras(edicao.descricao),
      quantidade: Number(edicao.quantidade) || 0,
      valorUnitario: Number(edicao.valorUnitario) || 0,
      valorDesconto: Number(edicao.valorDesconto) || 0,
      ...(edicao.tipo === 'produto_terceirizado'
        ? { valorCusto: Number(edicao.valorCusto) || 0, numeroNota: edicao.numeroNota, fornecedor: edicao.fornecedor }
        : {}),
    })
    setEdicao(null)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center size-7 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <Package size={15} />
        </div>
        <h2 className="font-medium">Produtos e Serviços</h2>
      </div>

      {!somenteLeitura && <ItemOrdemRowNovo onAdicionar={onAdicionar} adicionando={adicionando} podeVerLucro={podeVerLucro} />}

      <div className="border rounded-lg bg-card shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-muted-foreground">
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
                  <td className="px-3 py-2">
                    {emEdicao ? (
                      <input
                        value={edicao.descricao}
                        onChange={(e) => setEdicao({ ...edicao, descricao: e.target.value })}
                        className="w-full min-w-[10rem] h-8 rounded-md border bg-transparent px-2 text-sm outline-none focus:ring-1 focus:ring-primary/30"
                      />
                    ) : (
                      item.descricao
                    )}
                  </td>
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
                        <div className="w-28">
                          <CampoDesconto
                            valorBase={(Number(edicao.quantidade) || 0) * (Number(edicao.valorUnitario) || 0)}
                            value={edicao.valorDesconto}
                            onChange={(v) => setEdicao({ ...edicao, valorDesconto: v })}
                            compacto
                            mostrarLabel={false}
                          />
                        </div>
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

                  <td className="px-3 py-2">
                    {emEdicao && edicao.tipo === 'produto_terceirizado' ? (
                      <div className="w-40">
                        <Combobox<FornecedorSelect>
                          value={edicao.fornecedor}
                          onSelect={(fornecedor) => setEdicao({ ...edicao, fornecedor })}
                          onSearch={setTermoBuscaFornecedor}
                          items={fornecedoresEncontrados}
                          isLoading={buscandoFornecedores}
                          getKey={(f) => f.id}
                          getLabel={(f) => f.nome}
                          placeholder="Buscar fornecedor..."
                        />
                      </div>
                    ) : (
                      item.fornecedorNome ?? '-'
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {emEdicao && edicao.tipo === 'produto_terceirizado' ? (
                      <input
                        value={edicao.numeroNota}
                        onChange={(e) => setEdicao({ ...edicao, numeroNota: e.target.value })}
                        className="w-24 h-8 rounded-md border bg-transparent px-2 text-sm outline-none focus:ring-1 focus:ring-primary/30"
                      />
                    ) : (
                      item.numeroNota ?? '-'
                    )}
                  </td>
                  {podeVerLucro && (
                    <td className="px-3 py-2 text-right">
                      {emEdicao && edicao.tipo === 'produto_terceirizado' ? (
                        <CampoMoeda
                          value={edicao.valorCusto}
                          onChange={(v) => setEdicao({ ...edicao, valorCusto: v })}
                          className="w-20 h-8 rounded-md border bg-transparent px-2 text-sm text-right outline-none focus:ring-1 focus:ring-primary/30"
                        />
                      ) : margem != null ? (
                        `${margem.toFixed(0)}%`
                      ) : (
                        '-'
                      )}
                    </td>
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
                              className="p-1.5 rounded hover:bg-primary/10 hover:text-primary transition-colors"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onRemover(item.chave)}
                              className="p-1.5 rounded text-destructive hover:bg-destructive/10 transition-colors"
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
