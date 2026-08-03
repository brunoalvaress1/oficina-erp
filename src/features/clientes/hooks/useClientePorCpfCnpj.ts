import { useMutation } from '@tanstack/react-query'
import { buscarClientePorCpfCnpj } from '../services/clienteService'

export function useClientePorCpfCnpj() {
  return useMutation({
    mutationFn: (cpfCnpjFormatado: string) => buscarClientePorCpfCnpj(cpfCnpjFormatado),
  })
}
