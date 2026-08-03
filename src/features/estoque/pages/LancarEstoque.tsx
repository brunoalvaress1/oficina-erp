import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Combobox } from '@/components/ui/Combobox'
import { useFornecedoresSelect } from '@/features/fornecedores/hooks/useFornecedoresSelect'
import { useCreateFornecedor } from '@/features/fornecedores/hooks/useFornecedorMutations'
import { useLancarEstoque } from '../hooks/useLancarEstoque'
import { ItemNotaCard } from '../components/ItemNotaCard'
import { criarItemVazio, itemEstaCompleto, type ItemEstoqueForm } from '../types/itemForm'
import { formatCurrency } from '@/utils/format'
import { usePermissions } from '@/hooks/usePermissions'
import type { FornecedorSelect } from '@/features/fornecedores/types/fornecedor'

function hoje(): string {
  return new Date().toISOString().slice(0, 10)
}

export function LancarEstoque() {
  const navigate = useNavigate()
  const { hasPermission } = usePermissions()
  const podeVerLucro = hasPermission('estoque.visualizar_lucro')

  const [fornecedor, setFornecedor] = useState<FornecedorSelect | null>(null)
  const [termoBuscaFornecedor, setTermoBuscaFornecedor] = useState('')
  const [numeroNota, setNumeroNota] = useState('')
  const [dataNota, setDataNota] = useState(hoje())
  const [dataEntrada, setDataEntrada] = useState(hoje())
  const [observacoes, setObservacoes] = useState('')
  const [itens, setItens] = useState<ItemEstoqueForm[]>([criarItemVazio()])
  const [tentouSalvar, setTentouSalvar] = useState(false)

  const { data: fornecedoresEncontrados = [], isLoading: buscandoFornecedores } = useFornecedoresSelect(termoBuscaFornecedor)
  const criarFornecedor = useCreateFornecedor()
  const lancarEstoque = useLancarEstoque()

  function atualizarItem(chave: string, novoItem: ItemEstoqueForm) {
    setItens((prev) => prev.map((item) => (item.chave === chave ? novoItem : item)))
  }

  function duplicarItem(chave: string) {
    setItens((prev) => {
      const original = prev.find((item) => item.chave === chave)
      if (!original) return prev
      const copia: ItemEstoqueForm = { ...original, chave: crypto.randomUUID() }
      const indice = prev.findIndex((item) => item.chave === chave)
      const novaLista = [...prev]
      novaLista.splice(indice + 1, 0, copia)
      return novaLista
    })
  }

  function removerItem(chave: string) {
    setItens((prev) => (prev.length > 1 ? prev.filter((item) => item.chave !== chave) : prev))
  }

  function adicionarItem() {
    setItens((prev) => [...prev, criarItemVazio()])
  }

  const quantidadeProdutos = itens.length
  const quantidadeTotal = itens.reduce((soma, item) => soma + (Number(item.quantidade) || 0), 0)
  const valorTotalNota = itens.reduce((soma, item) => soma + (Number(item.quantidade) || 0) * (Number(item.valorCustoAtual) || 0), 0)
  const custoMedioGeral = quantidadeTotal > 0 ? valorTotalNota / quantidadeTotal : 0

  const cabecalhoValido = Boolean(fornecedor && numeroNota.trim() && dataNota && dataEntrada)
  const todosItensValidos = itens.every(itemEstaCompleto)
  const formularioValido = cabecalhoValido && todosItensValidos && itens.length > 0

  function handleCriarFornecedor(nome: string) {
    criarFornecedor.mutate(
      { nome },
      {
        onSuccess: (novoFornecedor) => setFornecedor(novoFornecedor),
      },
    )
  }

  function handleSalvar() {
    setTentouSalvar(true)
    if (!formularioValido) return

    lancarEstoque.mutate(
      {
        fornecedorId: fornecedor!.id,
        numeroNota: numeroNota.trim(),
        dataNota,
        dataEntrada,
        observacoes: observacoes || undefined,
        itens: itens.map((item) => ({
          produtoId: item.produto!.id,
          quantidade: Number(item.quantidade),
          valorCustoAtual: Number(item.valorCustoAtual),
          valorVendaOs: Number(item.valorVendaOs),
          ncm: item.ncm || undefined,
          cest: item.cest || undefined,
          cfop: item.cfop || undefined,
          classeImposto: item.classeImposto || undefined,
          origem: item.origem || undefined,
          situacaoTributaria: item.situacaoTributaria || undefined,
          cstPisCofins: item.cstPisCofins || undefined,
          cstIpi: item.cstIpi || undefined,
          observacoes: item.observacoes || undefined,
        })),
      },
      {
        onSuccess: () => navigate('/estoque'),
      },
    )
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Lançar Estoque</h1>
        <button
          type="button"
          onClick={() => navigate('/estoque')}
          className="h-9 px-4 rounded-md border text-sm font-medium"
        >
          Voltar
        </button>
      </div>

      <div className="rounded-lg border p-4 space-y-4">
        <h2 className="font-medium">Nota Fiscal</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-medium">Fornecedor *</label>
            <Combobox<FornecedorSelect>
              value={fornecedor}
              onSelect={setFornecedor}
              onSearch={setTermoBuscaFornecedor}
              items={fornecedoresEncontrados}
              isLoading={buscandoFornecedores}
              getKey={(f) => f.id}
              getLabel={(f) => f.nome}
              getDescription={(f) => f.cnpjCpf}
              placeholder="Buscar fornecedor..."
              onCriarNovo={handleCriarFornecedor}
              criarNovoLabel={(termo) => `Criar fornecedor "${termo}"`}
            />
            {tentouSalvar && !fornecedor && <p className="text-xs text-destructive">Selecione o fornecedor</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Número da Nota Fiscal *</label>
            <input
              value={numeroNota}
              onChange={(e) => setNumeroNota(e.target.value)}
              className={`w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 ${
                tentouSalvar && !numeroNota.trim() ? 'border-destructive focus:ring-destructive/40' : 'focus:ring-primary/30'
              }`}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Data da Nota *</label>
            <input
              type="date"
              value={dataNota}
              onChange={(e) => setDataNota(e.target.value)}
              className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Data de Entrada *</label>
            <input
              type="date"
              value={dataEntrada}
              onChange={(e) => setDataEntrada(e.target.value)}
              className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          <div className="space-y-1 md:col-span-3">
            <label className="text-sm font-medium">Observações</label>
            <input
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Produtos</h2>
          <button
            type="button"
            onClick={adicionarItem}
            className="flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium"
          >
            <Plus size={16} /> Adicionar Produto
          </button>
        </div>

        {itens.map((item, indice) => (
          <ItemNotaCard
            key={item.chave}
            item={item}
            indice={indice}
            tentouSalvar={tentouSalvar}
            podeVerLucro={podeVerLucro}
            onChange={(novoItem) => atualizarItem(item.chave, novoItem)}
            onDuplicar={() => duplicarItem(item.chave)}
            onRemover={() => removerItem(item.chave)}
          />
        ))}
      </div>

      <div className="rounded-lg border p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
          <div>
            <p className="text-muted-foreground text-xs">Qtd. de produtos</p>
            <p className="font-semibold text-lg">{quantidadeProdutos}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Quantidade total</p>
            <p className="font-semibold text-lg">{quantidadeTotal}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Valor total da nota</p>
            <p className="font-semibold text-lg">{formatCurrency(valorTotalNota)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Custo médio geral</p>
            <p className="font-semibold text-lg">{formatCurrency(custoMedioGeral)}</p>
          </div>
        </div>

        {!cabecalhoValido && (
          <p className="text-sm text-destructive mb-3">
            Preencha fornecedor, número da nota, data da nota e data de entrada para poder salvar.
          </p>
        )}
        {cabecalhoValido && tentouSalvar && !formularioValido && (
          <p className="text-sm text-destructive mb-3">
            Revise os campos destacados em vermelho antes de salvar.
          </p>
        )}

        <button
          type="button"
          onClick={handleSalvar}
          disabled={lancarEstoque.isPending || !cabecalhoValido}
          className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
        >
          {lancarEstoque.isPending ? 'Salvando...' : 'Salvar Lançamento'}
        </button>
      </div>
    </div>
  )
}
