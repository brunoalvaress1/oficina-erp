import { Link } from 'react-router-dom'
import { Wrench, Package, ArrowRight } from 'lucide-react'

const RELATORIOS = [
  {
    to: '/relatorios/lucro-pecas',
    icone: Package,
    titulo: 'Lucro em Peças',
    descricao: 'Quanto cada peça vendeu, custou e deu de lucro no período.',
  },
  {
    to: '/relatorios/lucro-servicos',
    icone: Wrench,
    titulo: 'Lucro em Serviços',
    descricao: 'Quanto cada serviço faturou no período (mão de obra é 100% lucro).',
  },
]

export function RelatoriosHome() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Relatórios</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {RELATORIOS.map((relatorio) => (
          <Link
            key={relatorio.to}
            to={relatorio.to}
            className="rounded-lg border p-5 flex items-start gap-4 hover:bg-muted/30 transition-colors"
          >
            <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <relatorio.icone size={20} />
            </div>
            <div className="flex-1">
              <h2 className="font-medium">{relatorio.titulo}</h2>
              <p className="text-sm text-muted-foreground">{relatorio.descricao}</p>
            </div>
            <ArrowRight size={16} className="text-muted-foreground shrink-0 mt-2" />
          </Link>
        ))}
      </div>
    </div>
  )
}
