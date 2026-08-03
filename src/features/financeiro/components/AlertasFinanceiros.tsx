import { AlertTriangle, TriangleAlert } from 'lucide-react'
import { useAlertasFinanceiro } from '../hooks/useDashboardFinanceiro'

export function AlertasFinanceiros() {
  const { data: alertas, isLoading } = useAlertasFinanceiro()

  if (isLoading) return null
  if (!alertas || alertas.length === 0) return null

  return (
    <div className="rounded-lg border p-4 space-y-2">
      <h2 className="font-medium text-sm">Alertas</h2>
      <div className="space-y-2">
        {alertas.map((alerta, indice) => (
          <div
            key={indice}
            className={`flex items-start gap-2 rounded-md p-2 text-sm ${
              alerta.severidade === 'critico' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
            }`}
          >
            {alerta.severidade === 'critico' ? (
              <TriangleAlert size={16} className="mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            )}
            <div>
              <p className="font-medium">{alerta.titulo}</p>
              <p className="text-xs opacity-80">{alerta.descricao}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
