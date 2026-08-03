import { useState } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import { useFuncionarios } from '@/features/funcionarios/hooks/useFuncionarios'
import { useAtualizarFuncionario } from '@/features/funcionarios/hooks/useFuncionarioMutations'
import type { Funcionario } from '@/features/funcionarios/types/funcionario'

export function Mecanicos() {
  const { data, isLoading } = useFuncionarios({ pageSize: 200 })
  const atualizar = useAtualizarFuncionario()

  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [especialidade, setEspecialidade] = useState('')
  const [comissaoPercentual, setComissaoPercentual] = useState('')

  function iniciarEdicao(funcionario: Funcionario) {
    setEditandoId(funcionario.id)
    setEspecialidade(funcionario.especialidade ?? '')
    setComissaoPercentual(funcionario.comissaoPercentual != null ? String(funcionario.comissaoPercentual) : '')
  }

  function salvar(id: string) {
    atualizar.mutate(
      { id, alteracoes: { especialidade: especialidade || undefined, comissaoPercentual: comissaoPercentual === '' ? undefined : Number(comissaoPercentual) } },
      { onSuccess: () => setEditandoId(null) },
    )
  }

  const funcionarios = data?.data ?? []

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold">Mecânicos</h1>
        <p className="text-sm text-muted-foreground">Especialidade e comissão dos funcionários — usado como referência nas Ordens de Serviço.</p>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-3 py-2">Nome</th>
              <th className="text-left font-medium px-3 py-2">Especialidade</th>
              <th className="text-left font-medium px-3 py-2">Comissão (%)</th>
              <th className="text-right font-medium px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">Carregando...</td>
              </tr>
            )}
            {!isLoading && funcionarios.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">Nenhum funcionário cadastrado</td>
              </tr>
            )}
            {funcionarios.map((funcionario) => {
              const editando = editandoId === funcionario.id
              return (
                <tr key={funcionario.id} className="border-t">
                  <td className="px-3 py-2 font-medium">{funcionario.nome}</td>
                  <td className="px-3 py-2">
                    {editando ? (
                      <input
                        value={especialidade}
                        onChange={(e) => setEspecialidade(e.target.value)}
                        placeholder="Ex: Motor, Suspensão..."
                        className="h-8 w-full px-2 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    ) : (
                      funcionario.especialidade ?? <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {editando ? (
                      <input
                        type="number"
                        step="0.01"
                        value={comissaoPercentual}
                        onChange={(e) => setComissaoPercentual(e.target.value)}
                        className="h-8 w-24 px-2 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    ) : funcionario.comissaoPercentual != null ? (
                      `${funcionario.comissaoPercentual}%`
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      {editando ? (
                        <>
                          <button type="button" onClick={() => salvar(funcionario.id)} title="Salvar" className="h-7 w-7 flex items-center justify-center rounded-md border text-green-700">
                            <Check size={13} />
                          </button>
                          <button type="button" onClick={() => setEditandoId(null)} title="Cancelar" className="h-7 w-7 flex items-center justify-center rounded-md border">
                            <X size={13} />
                          </button>
                        </>
                      ) : (
                        <button type="button" onClick={() => iniciarEdicao(funcionario)} title="Editar" className="h-7 w-7 flex items-center justify-center rounded-md border">
                          <Pencil size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
