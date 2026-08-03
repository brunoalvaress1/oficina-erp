import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { usePermissions } from '@/hooks/usePermissions'
import { listarBackups, registrarBackupManual } from '../services/backupService'

export function useBackups() {
  const { funcionario } = usePermissions()
  return useQuery({
    queryKey: ['backups', funcionario?.oficinaId],
    queryFn: () => listarBackups(funcionario!.oficinaId),
    enabled: !!funcionario?.oficinaId,
  })
}

export function useRegistrarBackup() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()
  return useMutation({
    mutationFn: (observacoes?: string) => registrarBackupManual(funcionario!.oficinaId, funcionario!.id, observacoes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] })
      toast.success('Backup registrado')
    },
    onError: (error: Error) => toast.error('Erro ao registrar', { description: error.message }),
  })
}
