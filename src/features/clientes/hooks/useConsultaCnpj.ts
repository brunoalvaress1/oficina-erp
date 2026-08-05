import { useMutation } from '@tanstack/react-query'
import { consultarCnpj } from '../services/consultaCnpjService'

export function useConsultaCnpj() {
  return useMutation({
    mutationFn: (cnpj: string) => consultarCnpj(cnpj),
  })
}
