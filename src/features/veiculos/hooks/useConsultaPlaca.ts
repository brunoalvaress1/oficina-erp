import { useMutation } from '@tanstack/react-query'
import { consultarPlaca } from '../services/consultaPlacaService'

export function useConsultaPlaca() {
  return useMutation({
    mutationFn: (placa: string) => consultarPlaca(placa),
  })
}
