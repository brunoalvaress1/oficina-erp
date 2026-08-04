import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}

interface DialogContentProps {
  className?: string
  children: ReactNode
}

interface DialogHeaderProps {
  className?: string
  children: ReactNode
}

interface DialogTitleProps {
  className?: string
  children: ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  useEffect(() => {
    if (!open) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onOpenChange(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="relative max-h-full max-w-full">
          {children}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Fechar"
            className="absolute top-3 right-3 p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

export function DialogContent({ className, children }: DialogContentProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className={cn(
        // max-h/overflow por padrão em toda a base — sem isso, telas menores
        // (notebook) faziam o topo do modal (com o X de fechar) sair da
        // viewport quando o conteúdo era grande, sem como rolar até ele.
        'w-full rounded-lg border bg-background p-4 shadow-lg max-h-[85vh] overflow-y-auto',
        className
      )}
    >
      {children}
    </div>
  )
}

export function DialogHeader({ className, children }: DialogHeaderProps) {
  return <div className={cn('mb-4', className)}>{children}</div>
}

export function DialogTitle({ className, children }: DialogTitleProps) {
  return <h2 className={cn('text-lg font-semibold', className)}>{children}</h2>
}
