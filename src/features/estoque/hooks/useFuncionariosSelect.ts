import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { usePermissions } from '@/hooks/usePermissions'

interface FuncionarioSelect {
  id: string
  nome: string
}

export function useFuncionariosSelect() {
  const { funcionario } = usePermissions()

  return useQuery({
    queryKey: ['funcionarios-select', funcionario?.oficinaId],
    queryFn: async (): Promise<FuncionarioSelect[]> => {
      const { data, error } = await supabase
        .from('funcionarios')
        .select('id, nome')
        .eq('oficina_id', funcionario!.oficinaId)
        .order('nome')
      if (error) throw new Error(error.message)
      return data ?? []
    },
    enabled: !!funcionario?.oficinaId,
    staleTime: 1000 * 60,
  })
}
