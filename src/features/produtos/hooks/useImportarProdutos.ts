import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { gerarPreviewImportacaoProdutos, confirmarImportacaoProdutos } from '../services/importadorProdutos'
import { usePermissions } from '@/hooks/usePermissions'
import type { LinhaImportacaoProdutoPreview } from '../types/importacaoProduto'

export function useGerarPreviewImportacaoProdutos() {
  return useMutation({
    mutationFn: (conteudoCsv: string) => gerarPreviewImportacaoProdutos(conteudoCsv),
    onError: (error: Error) => {
      toast.error('Erro ao processar o arquivo', { description: error.message })
    },
  })
}

export function useConfirmarImportacaoProdutos() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()

  return useMutation({
    mutationFn: (linhas: LinhaImportacaoProdutoPreview[]) =>
      confirmarImportacaoProdutos(linhas, funcionario!.oficinaId),
    onSuccess: (resultado) => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
      if (resultado.falhas === 0) {
        toast.success(`${resultado.importados} produto(s) importado(s) com sucesso`)
      } else {
        toast.warning(`${resultado.importados} importado(s) de ${resultado.totalLinhas} linha(s)`)
      }
    },
    onError: (error: Error) => {
      toast.error('Erro ao importar produtos', { description: error.message })
    },
  })
}
