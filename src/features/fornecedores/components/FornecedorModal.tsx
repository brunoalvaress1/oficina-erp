import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FornecedorForm } from './FornecedorForm'
import { useCreateFornecedor, useUpdateFornecedor } from '../hooks/useFornecedorMutations'
import type { Fornecedor } from '../types/fornecedor'
import type { FornecedorFormValues } from '../schemas/fornecedorSchema'

interface FornecedorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fornecedorExistente?: Fornecedor
}

export function FornecedorModal({ open, onOpenChange, fornecedorExistente }: FornecedorModalProps) {
  const createMutation = useCreateFornecedor()
  const updateMutation = useUpdateFornecedor()

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  function handleSubmit(values: FornecedorFormValues) {
    if (fornecedorExistente) {
      updateMutation.mutate(
        { id: fornecedorExistente.id, input: values },
        { onSuccess: () => onOpenChange(false) },
      )
    } else {
      createMutation.mutate(values, { onSuccess: () => onOpenChange(false) })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{fornecedorExistente ? 'Editar Fornecedor' : 'Novo Fornecedor'}</DialogTitle>
        </DialogHeader>
        <FornecedorForm
          fornecedorExistente={fornecedorExistente}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  )
}
