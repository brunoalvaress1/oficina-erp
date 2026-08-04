import { useState } from 'react'
import { Combobox } from '@/components/ui/Combobox'
import { CampoMoeda } from '@/components/ui/CampoMoeda'
import { useProdutosBusca } from '@/features/produtos/hooks/useProdutosBusca'
import { useFornecedoresSelect } from '@/features/fornecedores/hooks/useFornecedoresSelect'
import { usePermissions } from '@/hooks/usePermissions'
import { useServicosBusca, useCriarServico } from '../hooks/useServicosBusca'
import { usePecasTerceirizadasBusca } from '../hooks/usePecasTerceirizadas'
import { garantirPecaNoCatalogo } from '../services/pecaTerceirizadaService'
import { criarItemVazio, itemEstaCompleto, type ItemOrdemForm } from '../types/itemOrdemForm'
import type { TipoItemOrdem } from '../types/ordemServico'
import type { Produto } from '@/features/produtos/types/produto'
import type { FornecedorSelect } from '@/features/fornecedores/types/fornecedor'
import type { Servico } from '../types/servico'
import type { PecaTerceirizada } from '../types/pecaTerceirizada'

const ROTULO_TIPO: Record<TipoItemOrdem, string> = {
  produto_estoque: 'Produto (Estoque)',
  produto_terceirizado: 'Produto Terceirizado',
  servico: 'Serviço',
}

const COR_TIPO_ATIVO: Record<TipoItemOrdem, string> = {
  produto_estoque: 'bg-blue-600 text-white border-blue-600',
  produto_terceirizado: 'bg-amber-500 text-white border-amber-500',
  servico: 'bg-emerald-600 text-white border-emerald-600',
}

interface ItemOrdemRowNovoProps {
  onAdicionar: (item: ItemOrdemForm) => void
  adicionando?: boolean
}

export function ItemOrdemRowNovo({ onAdicionar, adicionando }: ItemOrdemRowNovoProps) {
  const { funcionario } = usePermissions()
  const [item, setItem] = useState<ItemOrdemForm>(() => criarItemVazio())
  const [tentouAdicionar, setTentouAdicionar] = useState(false)
  const [termoBusca, setTermoBusca] = useState('')
  const [termoBuscaPeca, setTermoBuscaPeca] = useState('')

  const { data: produtosEncontrados = [], isLoading: buscandoProdutos } = useProdutosBusca(
    item.tipo === 'produto_estoque' ? termoBusca : '',
  )
  const { data: fornecedoresEncontrados = [], isLoading: buscandoFornecedores } = useFornecedoresSelect(
    item.tipo === 'produto_terceirizado' ? termoBusca : '',
  )
  const { data: servicosEncontrados = [], isLoading: buscandoServicos } = useServicosBusca(
    item.tipo === 'servico' ? termoBusca : '',
  )
  const { data: pecasEncontradas = [] } = usePecasTerceirizadasBusca(
    item.tipo === 'produto_terceirizado' ? termoBuscaPeca : '',
  )
  const criarServico = useCriarServico()

  function trocarTipo(tipo: TipoItemOrdem) {
    setItem(criarItemVazio(tipo))
    setTermoBusca('')
  }

  function atualizar(alteracoes: Partial<ItemOrdemForm>) {
    setItem((prev) => ({ ...prev, ...alteracoes }))
  }

  function selecionarProduto(produto: Produto) {
    atualizar({
      produto,
      descricao: produto.nome,
      valorUnitario: String(produto.valorOs || ''),
      valorCusto: String(produto.custoMedio || produto.valorCusto || ''),
    })
  }

  function selecionarServico(servico: Servico) {
    atualizar({ servico, descricao: servico.nome, valorUnitario: String(servico.valorPadrao || '') })
  }

  function handleCriarServico(nome: string) {
    criarServico.mutate(
      { nome },
      { onSuccess: (novoServico) => selecionarServico(novoServico) },
    )
  }

  function handleAdicionar() {
    setTentouAdicionar(true)
    if (!itemEstaCompleto(item)) return

    if (item.tipo === 'produto_terceirizado' && funcionario) {
      garantirPecaNoCatalogo(item.descricao, funcionario.oficinaId).catch(() => {})
    }

    onAdicionar(item)

    setItem(criarItemVazio(item.tipo))
    setTentouAdicionar(false)
    setTermoBusca('')
  }

  return (
    <div className="rounded-lg border bg-card shadow-sm p-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(ROTULO_TIPO) as TipoItemOrdem[]).map((tipo) => (
          <button
            key={tipo}
            type="button"
            onClick={() => trocarTipo(tipo)}
            className={`h-8 px-3 rounded-md text-xs font-medium border transition-colors ${
              item.tipo === tipo ? COR_TIPO_ATIVO[tipo] : 'bg-background hover:bg-muted'
            }`}
          >
            {ROTULO_TIPO[tipo]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {item.tipo === 'produto_estoque' && (
          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-medium">Produto *</label>
            <Combobox<Produto>
              value={item.produto}
              onSelect={selecionarProduto}
              onSearch={setTermoBusca}
              items={produtosEncontrados}
              isLoading={buscandoProdutos}
              getKey={(p) => p.id}
              getLabel={(p) => p.nome}
              getDescription={(p) => `${p.codigoInterno ?? p.codigoBarras ?? ''} · estoque: ${p.estoqueFisico}`}
              placeholder="Buscar por nome, código ou código de barras..."
            />
            {tentouAdicionar && !item.produto && <p className="text-xs text-destructive">Selecione o produto</p>}
          </div>
        )}

        {item.tipo === 'servico' && (
          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-medium">Serviço *</label>
            <Combobox<Servico>
              value={item.servico}
              onSelect={selecionarServico}
              onSearch={setTermoBusca}
              items={servicosEncontrados}
              isLoading={buscandoServicos}
              getKey={(s) => s.id}
              getLabel={(s) => s.nome}
              getDescription={(s) => (s.valorPadrao ? `Valor padrão: ${s.valorPadrao}` : null)}
              placeholder="Buscar serviço (mão de obra, alinhamento...)"
              onCriarNovo={handleCriarServico}
              criarNovoLabel={(termo) => `Criar serviço "${termo}"`}
            />
            {tentouAdicionar && !item.descricao.trim() && <p className="text-xs text-destructive">Selecione ou descreva o serviço</p>}
          </div>
        )}

        {item.tipo === 'produto_terceirizado' && (
          <>
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium">Descrição *</label>
              <Combobox<PecaTerceirizada>
                value={item.descricao ? { id: '', oficinaId: '', nome: item.descricao, createdAt: '' } : null}
                onSelect={(peca) => atualizar({ descricao: peca.nome })}
                onSearch={(texto) => {
                  setTermoBuscaPeca(texto)
                  atualizar({ descricao: texto })
                }}
                items={pecasEncontradas}
                getKey={(p) => p.id}
                getLabel={(p) => p.nome}
                placeholder="Nome da peça — digite ou escolha uma já usada antes"
                emptyMessage="Nenhuma peça parecida já cadastrada"
              />
              {tentouAdicionar && !item.descricao.trim() && <p className="text-xs text-destructive">Obrigatório</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Fornecedor *</label>
              <Combobox<FornecedorSelect>
                value={item.fornecedor}
                onSelect={(fornecedor) => atualizar({ fornecedor })}
                onSearch={setTermoBusca}
                items={fornecedoresEncontrados}
                isLoading={buscandoFornecedores}
                getKey={(f) => f.id}
                getLabel={(f) => f.nome}
                placeholder="Buscar fornecedor..."
              />
              {tentouAdicionar && !item.fornecedor && <p className="text-xs text-destructive">Obrigatório</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Número Nota</label>
              <input
                value={item.numeroNota}
                onChange={(e) => atualizar({ numeroNota: e.target.value })}
                className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
          </>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium">Quantidade *</label>
          <input
            value={item.quantidade}
            onChange={(e) => atualizar({ quantidade: e.target.value.replace(/[^0-9.]/g, '') })}
            inputMode="decimal"
            className={`w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 ${
              tentouAdicionar && !(Number(item.quantidade) > 0) ? 'border-destructive focus:ring-destructive/40' : 'focus:ring-primary/30'
            }`}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Valor Unitário (OS) *</label>
          <CampoMoeda
            value={item.valorUnitario}
            onChange={(v) => atualizar({ valorUnitario: v })}
            className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>

        {item.tipo === 'produto_terceirizado' && (
          <div className="space-y-1">
            <label className="text-sm font-medium">Custo *</label>
            <CampoMoeda
              value={item.valorCusto}
              onChange={(v) => atualizar({ valorCusto: v })}
              className={`w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 ${
                tentouAdicionar && !(Number(item.valorCusto) > 0) ? 'border-destructive focus:ring-destructive/40' : 'focus:ring-primary/30'
              }`}
            />
          </div>
        )}

        {item.tipo === 'produto_estoque' && (
          <div className="space-y-1">
            <label className="text-sm font-medium">Valor de Custo</label>
            <CampoMoeda
              value={item.valorCusto}
              onChange={() => {}}
              disabled
              className="w-full h-9 rounded-md border bg-muted/40 px-3 text-sm outline-none disabled:opacity-70"
            />
            <p className="text-xs text-muted-foreground">Custo do produto — travado, não muda na OS</p>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium">Desconto</label>
          <CampoMoeda
            value={item.valorDesconto}
            onChange={(v) => atualizar({ valorDesconto: v })}
            className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleAdicionar}
          disabled={adicionando}
          className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {adicionando ? 'Adicionando...' : 'Adicionar Item'}
        </button>
      </div>
    </div>
  )
}
