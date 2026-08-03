import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CampoMoeda } from '@/components/ui/CampoMoeda'
import { Combobox } from '@/components/ui/Combobox'
import { buscarClientes } from '@/features/clientes/services/clienteService'
import { usePermissions } from '@/hooks/usePermissions'
import { useCriarContaReceber } from '../hooks/useContasReceber'
import { useCategoriasFinanceirasBusca, useCriarCategoriaFinanceira } from '../hooks/useCategoriasFinanceiras'
import { useCentrosCustoBusca, useCriarCentroCusto } from '../hooks/useCentrosCusto'
import type { CategoriaFinanceira } from '../types/categoriaFinanceira'
import type { CentroCusto } from '../types/centroCusto'

interface ClienteBusca {
  id: string
  nome: string
  cpf_cnpj: string | null
  telefone: string | null
}

interface ContaReceberModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ContaReceberModal({ open, onOpenChange }: ContaReceberModalProps) {
  const { funcionario } = usePermissions()
  const [documento, setDocumento] = useState('')
  const [cliente, setCliente] = useState<ClienteBusca | null>(null)
  const [nomeAvulso, setNomeAvulso] = useState('')
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [dataVencimento, setDataVencimento] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [categoria, setCategoria] = useState<CategoriaFinanceira | null>(null)
  const [centroCusto, setCentroCusto] = useState<CentroCusto | null>(null)

  const [clientesBusca, setClientesBusca] = useState<ClienteBusca[]>([])
  const [carregandoClientes, setCarregandoClientes] = useState(false)
  const categoriasBusca = useCategoriasFinanceirasBusca()
  const centrosCustoBusca = useCentrosCustoBusca()
  const criarCategoria = useCriarCategoriaFinanceira()
  const criarCentroCusto = useCriarCentroCusto()
  const criarContaReceber = useCriarContaReceber()

  async function handleBuscarClientes(termo: string) {
    setCarregandoClientes(true)
    try {
      const resultado = await buscarClientes(termo)
      setClientesBusca(resultado as ClienteBusca[])
    } finally {
      setCarregandoClientes(false)
    }
  }

  function limpar() {
    setDocumento('')
    setCliente(null)
    setNomeAvulso('')
    setDescricao('')
    setValor('')
    setDataVencimento('')
    setObservacoes('')
    setCategoria(null)
    setCentroCusto(null)
  }

  function handleSalvar() {
    criarContaReceber.mutate(
      {
        documento: documento || undefined,
        clienteId: cliente?.id,
        clienteNomeAvulso: !cliente ? nomeAvulso || undefined : undefined,
        descricao,
        categoriaId: categoria?.id,
        centroCustoId: centroCusto?.id,
        valor: Number(valor) || 0,
        dataVencimento,
        observacoes: observacoes || undefined,
      },
      { onSuccess: () => { limpar(); onOpenChange(false) } },
    )
  }

  const podeSalvar = descricao.trim() !== '' && Number(valor) > 0 && dataVencimento !== ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Conta a Receber</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Cliente cadastrado (opcional)</label>
            <Combobox
              value={cliente}
              onSelect={setCliente}
              onSearch={handleBuscarClientes}
              items={clientesBusca}
              isLoading={carregandoClientes}
              getKey={(c) => c.id}
              getLabel={(c) => c.nome}
              getDescription={(c) => c.cpf_cnpj}
              placeholder="Buscar cliente..."
            />
          </div>

          {!cliente && (
            <div className="space-y-1">
              <label className="text-sm font-medium">Nome avulso (se não tiver cadastro)</label>
              <input
                type="text"
                value={nomeAvulso}
                onChange={(e) => setNomeAvulso(e.target.value)}
                className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium">Documento (opcional)</label>
            <input
              type="text"
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
              className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Descrição *</label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Valor *</label>
              <CampoMoeda value={valor} onChange={setValor} className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Vencimento *</label>
              <input
                type="date"
                value={dataVencimento}
                onChange={(e) => setDataVencimento(e.target.value)}
                className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Categoria</label>
              <Combobox
                value={categoria}
                onSelect={setCategoria}
                onSearch={categoriasBusca.setTermo}
                items={categoriasBusca.data ?? []}
                isLoading={categoriasBusca.isLoading}
                getKey={(c) => c.id}
                getLabel={(c) => c.nome}
                onCriarNovo={(termo) => criarCategoria.mutate({ nome: termo }, { onSuccess: setCategoria })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Centro de Custo</label>
              <Combobox
                value={centroCusto}
                onSelect={setCentroCusto}
                onSearch={centrosCustoBusca.setTermo}
                items={centrosCustoBusca.data ?? []}
                isLoading={centrosCustoBusca.isLoading}
                getKey={(c) => c.id}
                getLabel={(c) => c.nome}
                onCriarNovo={(termo) => criarCentroCusto.mutate(termo, { onSuccess: setCentroCusto })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Observações</label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
              className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          <button
            type="button"
            disabled={!podeSalvar || !funcionario || criarContaReceber.isPending}
            onClick={handleSalvar}
            className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
          >
            {criarContaReceber.isPending ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
