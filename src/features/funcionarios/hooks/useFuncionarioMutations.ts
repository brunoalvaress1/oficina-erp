import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { usePermissions } from '@/hooks/usePermissions'
import { atualizarFuncionario, criarFuncionario, excluirFuncionario } from '../services/funcionarioService'
import type { FuncionarioAtualizacaoInput, FuncionarioInput } from '../types/funcionario'

export function useCriarFuncionario() {
  const queryClient = useQueryClient()
  const { funcionario } = usePermissions()

  return useMutation({
    mutationFn: (input: FuncionarioInput) => criarFuncionario(input, funcionario!.oficinaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] })
      toast.success('Funcionário cadastrado com sucesso')
    },
    onError: (error: Error) => toast.error('Erro ao cadastrar funcionário', { description: error.message }),
  })
}

export function useAtualizarFuncionario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, alteracoes }: { id: string; alteracoes: FuncionarioAtualizacaoInput }) =>
      atualizarFuncionario(id, alteracoes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] })
      toast.success('Funcionário atualizado')
    },
    onError: (error: Error) => toast.error('Erro ao atualizar funcionário', { description: error.message }),
  })
}

export function useExcluirFuncionario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => excluirFuncionario(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] })
      toast.success('Funcionário excluído')
    },
    onError: (error: Error) => toast.error('Erro ao excluir funcionário', { description: error.message }),
  })
}
