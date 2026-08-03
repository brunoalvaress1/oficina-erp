import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { lancarEstoque } from '../services/notaFiscalService'
import { usePermissions } from '@/hooks/usePermissions'
import type { LancarEstoqueInput } from '../types/notaFiscal'

export function useLancarEstoque() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()

  return useMutation({
    mutationFn: (input: LancarEstoqueInput) => lancarEstoque(input, funcionario!.oficinaId, funcionario!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notas-fiscais'] })
      queryClient.invalidateQueries({ queryKey: ['movimentacoes'] })
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
      toast.success('Estoque lançado com sucesso')
    },
    onError: (error: Error) => {
      toast.error('Erro ao lançar estoque', { description: error.message })
    },
  })
}
