import { useState } from 'react'
import { useBackups, useRegistrarBackup } from '../hooks/useBackup'

export function Backup() {
  const { data: backups, isLoading } = useBackups()
  const registrar = useRegistrarBackup()
  const [observacoes, setObservacoes] = useState('')

  function handleRegistrar() {
    registrar.mutate(observacoes || undefined, { onSuccess: () => setObservacoes('') })
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold">Backup</h1>
        <p className="text-sm text-muted-foreground">
          O banco de dados já é gerenciado e mantém backups automáticos no Supabase (nível de infraestrutura) — não é
          possível disparar ou restaurar um backup real a partir do navegador. Esta tela serve só para registrar manualmente
          quando você conferiu que os dados estão íntegros, como um checkpoint.
        </p>
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <h2 className="font-medium text-sm">Registrar checkpoint manual</h2>
        <input
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Observação (opcional)"
          className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30"
        />
        <button type="button" onClick={handleRegistrar} disabled={registrar.isPending} className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
          {registrar.isPending ? 'Registrando...' : 'Registrar checkpoint'}
        </button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-3 py-2">Data</th>
              <th className="text-left font-medium px-3 py-2">Registrado por</th>
              <th className="text-left font-medium px-3 py-2">Observações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">Carregando...</td>
              </tr>
            )}
            {!isLoading && (backups ?? []).length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">Nenhum checkpoint registrado</td>
              </tr>
            )}
            {(backups ?? []).map((backup) => (
              <tr key={backup.id} className="border-t">
                <td className="px-3 py-2">{new Date(backup.createdAt).toLocaleString('pt-BR')}</td>
                <td className="px-3 py-2 text-muted-foreground">{backup.funcionarioNome ?? '-'}</td>
                <td className="px-3 py-2 text-muted-foreground">{backup.observacoes ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
