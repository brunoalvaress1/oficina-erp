import { useMutation } from '@tanstack/react-query'
import { consultarCpf } from '../services/consultaCpfService'

export function useConsultaCpf() {
  return useMutation({
    mutationFn: (cpf: string) => consultarCpf(cpf),
  })
}
