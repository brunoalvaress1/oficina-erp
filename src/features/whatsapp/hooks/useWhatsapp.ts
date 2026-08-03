import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { consultarStatusWhatsapp, gerarQrCodeWhatsapp } from '../services/whatsappService'

export function useStatusWhatsapp(habilitado: boolean) {
  return useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: () => consultarStatusWhatsapp(),
    enabled: habilitado,
    refetchInterval: (query) => (query.state.data === 'open' ? false : 5000),
  })
}

export function useGerarQrCodeWhatsapp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => gerarQrCodeWhatsapp(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['whatsapp-status'] }),
    onError: (error: Error) => toast.error('Erro ao gerar QR Code', { description: error.message }),
  })
}
