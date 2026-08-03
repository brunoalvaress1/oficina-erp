import type { LinhaImportacaoPreview } from '../types/importacao'

interface ImportPreviewTableProps {
  linhas: LinhaImportacaoPreview[]
}

const ROTULOS_STATUS: Record<LinhaImportacaoPreview['status'], string> = {
  valido: 'Válido',
  erro: 'Erro',
  duplicado: 'Duplicado',
}

const CLASSES_STATUS: Record<LinhaImportacaoPreview['status'], string> = {
  valido: 'bg-emerald-500/10 text-emerald-600',
  erro: 'bg-destructive/10 text-destructive',
  duplicado: 'bg-amber-500/10 text-amber-600',
}

export function ImportPreviewTable({ linhas }: ImportPreviewTableProps) {
  return (
    <div className="border rounded-lg overflow-auto max-h-96">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-muted-foreground sticky top-0">
          <tr>
            <th className="text-left font-medium px-3 py-2">Linha</th>
            <th className="text-left font-medium px-3 py-2">Placa</th>
            <th className="text-left font-medium px-3 py-2">Modelo</th>
            <th className="text-left font-medium px-3 py-2">Cliente</th>
            <th className="text-left font-medium px-3 py-2">Status</th>
            <th className="text-left font-medium px-3 py-2">Detalhes</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha) => (
            <tr key={linha.linha} className="border-t">
              <td className="px-3 py-2">{linha.linha}</td>
              <td className="px-3 py-2 font-medium">{linha.dados.placa ?? '-'}</td>
              <td className="px-3 py-2">{linha.dados.modelo ?? '-'}</td>
              <td className="px-3 py-2">
                {linha.clienteNomeResolvido ?? linha.dados.clienteNome ?? linha.dados.clienteCpfCnpj ?? '-'}
              </td>
              <td className="px-3 py-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CLASSES_STATUS[linha.status]}`}>
                  {ROTULOS_STATUS[linha.status]}
                </span>
              </td>
              <td className="px-3 py-2 text-muted-foreground">{linha.erros.join('; ') || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
