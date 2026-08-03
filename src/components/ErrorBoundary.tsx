import { Component, type ErrorInfo, type ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
  info: ErrorInfo | null
}

// Sem isso, qualquer erro de render em qualquer tela derruba a árvore inteira do
// React (tela toda em branco, sidebar incluída) — com o boundary, só a área de
// conteúdo mostra o erro e o resto do layout continua de pé.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null, info: null }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.setState({ error, info })
    console.error('ErrorBoundary capturou um erro:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 space-y-3">
          <div className="flex items-center gap-2 text-destructive font-medium">
            <TriangleAlert size={18} />
            Ocorreu um erro ao carregar esta tela
          </div>
          <p className="text-sm text-muted-foreground">{this.state.error.message}</p>
          <pre className="text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto bg-muted/40 p-3 rounded-md">
            {this.state.error.stack}
            {this.state.info?.componentStack}
          </pre>
          <button
            type="button"
            onClick={() => this.setState({ error: null, info: null })}
            className="h-9 px-4 rounded-md border text-sm font-medium"
          >
            Tentar novamente
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
