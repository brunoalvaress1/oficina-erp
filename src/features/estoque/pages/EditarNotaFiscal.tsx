import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { useNotaFiscalDetalhe, useAdicionarItemNota, useRemoverItemNota } from '../hooks/useNotasFiscais'
import { useProdutosBusca } from '@/features/produtos/hooks/useProdutosBusca'
import { Combobox } from '@/components/ui/Combobox'
import { PermissionGate } from '../components/PermissionGate'
import { formatCurrency, formatDate } from '@/utils/format'
import type { Produto } from '@/features/produtos/types/produto'

const ROTULOS_ACAO: Record<string, string> = {
  criada: 'Nota criada',
  editada: 'Nota editada',
  produto_adicionado: 'Produto adicionado',
  produto_removido: 'Produto removido',
}

export function EditarNotaFiscal() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading } = useNotaFiscalDetalhe(id)
  const adicionarItem = useAdicionarItemNota()
  const removerItem = useRemoverItemNota()

  const [produtoNovo, setProdutoNovo] = useState<Produto | null>(null)
  const [termoBusca, setTermoBusca] = useState('')
  const [quantidade, setQuantidade] = useState('')
  const [valorCustoAtual, setValorCustoAtual] = useState('')

  const { data: produtosEncontrados = [], isLoading: buscandoProdutos } = useProdutosBusca(termoBusca)

  if (isLoading) {
    return <p className="text-muted-foreground">Carregando...</p>
  }

  if (!data) {
    return <p className="text-muted-foreground">Nota fiscal não encontrada.</p>
  }

  const { nota, itens, historico } = data

  function handleSelecionarProduto(produto: Produto) {
    setProdutoNovo(produto)
    setValorCustoAtual(produto.valorCusto ? String(produto.valorCusto) : '')
  }

  function handleAdicionar() {
    if (!produtoNovo || !(Number(quantidade) > 0) || !(Number(valorCustoAtual) > 0)) return
    adicionarItem.mutate(
      {
        notaFiscalId: nota.id,
        item: {
          produtoId: produtoNovo.id,
          quantidade: Number(quantidade),
          valorCustoAtual: Number(valorCustoAtual),
        },
      },
      {
        onSuccess: () => {
          setProdutoNovo(null)
          setQuantidade('')
          setValorCustoAtual('')
        },
      },
    )
  }

  function handleRemover(itemId: string) {
    if (confirm('Remover este produto da nota? O estoque lançado por ele será revertido.')) {
      removerItem.mutate({ itemId, notaFiscalId: nota.id })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Nota Fiscal {nota.numeroNota}</h1>
        <button type="button" onClick={() => navigate('/estoque/notas')} className="h-9 px-4 rounded-md border text-sm font-medium">
          Voltar
        </button>
      </div>

      <div className="rounded-lg border p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground text-xs">Fornecedor</p>
          <p className="font-medium">{nota.fornecedorNome ?? '-'}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Data da Nota</p>
          <p className="font-medium">{formatDate(nota.dataNota)}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Data de Entrada</p>
          <p className="font-medium">{formatDate(nota.dataEntrada)}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Valor Total</p>
          <p className="font-medium">{formatCurrency(nota.valorProdutos)}</p>
        </div>
        {nota.observacoes && (
          <div className="col-span-2 md:col-span-4">
            <p className="text-muted-foreground text-xs">Observações</p>
            <p className="font-medium">{nota.observacoes}</p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="font-medium">Produtos da Nota</h2>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-4 py-2">Produto</th>
                <th className="text-left font-medium px-4 py-2">Quantidade</th>
                <th className="text-left font-medium px-4 py-2">Custo</th>
                <th className="text-left font-medium px-4 py-2">Total</th>
                <th className="text-right font-medium px-4 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {itens.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                    Nenhum produto nesta nota
                  </td>
                </tr>
              )}
              {itens.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-4 py-2 font-medium">{item.produtoNome ?? '-'}</td>
                  <td className="px-4 py-2">{item.quantidade}</td>
                  <td className="px-4 py-2">{formatCurrency(item.valorCustoAtual)}</td>
                  <td className="px-4 py-2">{formatCurrency(item.quantidade * item.valorCustoAtual)}</td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end">
                      <PermissionGate codigo="estoque.editar">
                        <button
                          type="button"
                          onClick={() => handleRemover(item.id)}
                          className="p-1.5 rounded hover:bg-muted text-destructive"
                        >
                          <Trash2 size={15} />
                        </button>
                      </PermissionGate>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <PermissionGate codigo="estoque.editar">
        <div className="rounded-lg border p-4 space-y-3">
          <h2 className="font-medium">Adicionar Produto</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium">Produto</label>
              <Combobox<Produto>
                value={produtoNovo}
                onSelect={handleSelecionarProduto}
                onSearch={setTermoBusca}
                items={produtosEncontrados}
                isLoading={buscandoProdutos}
                getKey={(p) => p.id}
                getLabel={(p) => p.nome}
                getDescription={(p) => `estoque atual: ${p.estoqueFisico}`}
                placeholder="Buscar produto..."
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Quantidade</label>
              <input
                type="number"
                min={1}
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Valor Custo</label>
              <input
                type="number"
                step="0.01"
                value={valorCustoAtual}
                onChange={(e) => setValorCustoAtual(e.target.value)}
                className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleAdicionar}
            disabled={adicionarItem.isPending || !produtoNovo || !(Number(quantidade) > 0) || !(Number(valorCustoAtual) > 0)}
            className="flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
          >
            <Plus size={16} /> {adicionarItem.isPending ? 'Adicionando...' : 'Adicionar à Nota'}
          </button>
        </div>
      </PermissionGate>

      <div className="space-y-2">
        <h2 className="font-medium">Histórico</h2>
        <div className="border rounded-lg divide-y">
          {historico.length === 0 && <p className="px-4 py-3 text-sm text-muted-foreground">Sem histórico</p>}
          {historico.map((entrada) => (
            <div key={entrada.id} className="px-4 py-2.5 text-sm flex items-center justify-between">
              <span>
                <span className="font-medium">{ROTULOS_ACAO[entrada.acao] ?? entrada.acao}</span>
                {entrada.funcionarioNome && <span className="text-muted-foreground"> por {entrada.funcionarioNome}</span>}
              </span>
              <span className="text-muted-foreground text-xs">{formatDate(entrada.createdAt)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
