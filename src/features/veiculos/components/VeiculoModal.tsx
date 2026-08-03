import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { VeiculoForm } from './VeiculoForm'
import { useCreateVeiculo, useUpdateVeiculo } from '../hooks/useVeiculoMutations'
import type { Veiculo } from '../types/veiculo'
import type { VeiculoFormValues } from '../schemas/veiculoSchema'

interface VeiculoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  veiculoExistente?: Veiculo
}

export function VeiculoModal({ open, onOpenChange, veiculoExistente }: VeiculoModalProps) {
  const createMutation = useCreateVeiculo()
  const updateMutation = useUpdateVeiculo()

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  function handleSubmit(values: VeiculoFormValues) {
    const input = {
      clienteId: values.clienteId,
      placa: values.placa.toUpperCase().replace(/[^A-Z0-9]/g, ''),
      marca: values.marca,
      modelo: values.modelo,
      cor: values.cor,
      ano: values.ano,
      anoModelo: values.anoModelo,
      chassi: values.chassi,
      kmAtual: values.kmAtual ? Number(values.kmAtual) : undefined,
      combustivel: values.combustivel,
      motor: values.motor,
      opcionais: values.opcionais,
      observacoes: values.observacoes,
    }

    if (veiculoExistente) {
      updateMutation.mutate(
        { id: veiculoExistente.id, input },
        { onSuccess: () => onOpenChange(false) }
      )
    } else {
      createMutation.mutate(input, { onSuccess: () => onOpenChange(false) })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{veiculoExistente ? 'Editar Veículo' : 'Novo Veículo'}</DialogTitle>
        </DialogHeader>
        <VeiculoForm
          veiculoExistente={veiculoExistente}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  )
}