import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ClienteForm } from './ClienteForm'
import { useCreateCliente, useUpdateCliente } from '../hooks/useClienteMutations'
import type { Cliente } from '../types/cliente'
import type { ClienteFormValues } from '../schemas/clienteSchema'

interface ClienteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clienteExistente?: Cliente
}

export function ClienteModal({ open, onOpenChange, clienteExistente }: ClienteModalProps) {
  const createMutation = useCreateCliente()
  const updateMutation = useUpdateCliente()

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  function handleSubmit(values: ClienteFormValues) {
    if (clienteExistente) {
      updateMutation.mutate(
        { id: clienteExistente.id, input: values },
        { onSuccess: () => onOpenChange(false) }
      )
    } else {
      createMutation.mutate(values, { onSuccess: () => onOpenChange(false) })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{clienteExistente ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
        </DialogHeader>
        <ClienteForm
          clienteExistente={clienteExistente}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  )
}