import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ProdutoForm } from './ProdutoForm'
import { useCreateProduto, useUpdateProduto } from '../hooks/useProdutoMutations'
import type { Produto } from '../types/produto'
import type { ProdutoFormValues } from '../schemas/produtoSchema'

interface ProdutoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  produtoExistente?: Produto
  // Produto usado só como ponto de partida pra preencher o formulário (ex:
  // "Clonar") — ao contrário de produtoExistente, salvar aqui CRIA um
  // produto novo, não atualiza o original.
  produtoParaClonar?: Produto
}

export function ProdutoModal({ open, onOpenChange, produtoExistente, produtoParaClonar }: ProdutoModalProps) {
  const createMutation = useCreateProduto()
  const updateMutation = useUpdateProduto()
  // Estoque físico não é clonado — o clone ainda não tem nenhuma unidade
  // física recebida; o fluxo normal é o usuário lançar isso depois em
  // "Lançar Estoque" (com nota fiscal, entra no histórico de movimentações).
  const valoresIniciais = produtoExistente ?? (produtoParaClonar ? { ...produtoParaClonar, estoqueFisico: 0 } : undefined)

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  function handleSubmit(values: ProdutoFormValues) {
    const input = {
      nome: values.nome,
      categoria: values.categoria,
      subcategoria: values.subcategoria,
      marca: values.marca,
      codigoFabricante: values.codigoFabricante,
      codigoInterno: values.codigoInterno,
      codigoBarras: values.codigoBarras,
      valorCusto: values.valorCusto ? Number(values.valorCusto) : undefined,
      valorOs: values.valorOs ? Number(values.valorOs) : undefined,
      estoqueFisico: values.estoqueFisico ? Number(values.estoqueFisico) : undefined,
      ncm: values.ncm,
      impostoId: values.impostoId || null,
      observacoes: values.observacoes,
    }

    if (produtoExistente) {
      updateMutation.mutate({ id: produtoExistente.id, input }, { onSuccess: () => onOpenChange(false) })
    } else {
      createMutation.mutate(input, { onSuccess: () => onOpenChange(false) })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{produtoExistente ? 'Editar Produto' : produtoParaClonar ? 'Clonar Produto' : 'Novo Produto'}</DialogTitle>
        </DialogHeader>
        <ProdutoForm produtoExistente={valoresIniciais} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </DialogContent>
    </Dialog>
  )
}
