import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { gerarPreviewImportacao, confirmarImportacao } from '../services/importadorVeiculos'
import { usePermissions } from '@/hooks/usePermissions'
import type { LinhaImportacaoPreview } from '../types/importacao'

export function useGerarPreviewImportacao() {
  return useMutation({
    mutationFn: (conteudoCsv: string) => gerarPreviewImportacao(conteudoCsv),
    onError: (error: Error) => {
      toast.error('Erro ao processar o arquivo', { description: error.message })
    },
  })
}

export function useConfirmarImportacao() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()

  return useMutation({
    mutationFn: (linhas: LinhaImportacaoPreview[]) => confirmarImportacao(linhas, funcionario!.oficinaId),
    onSuccess: (resultado) => {
      queryClient.invalidateQueries({ queryKey: ['veiculos'] })
      if (resultado.falhas === 0) {
        toast.success(`${resultado.importados} veículo(s) importado(s) com sucesso`)
      } else {
        toast.warning(`${resultado.importados} importado(s) de ${resultado.totalLinhas} linha(s)`)
      }
    },
    onError: (error: Error) => {
      toast.error('Erro ao importar veículos', { description: error.message })
    },
  })
}
