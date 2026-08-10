import { useState } from 'react'
import { AlertTriangle, Calendar, Check, Copy, ShieldAlert, ShieldCheck, Wallet } from 'lucide-react'
import { formatCurrency, formatDate } from '@/utils/format'
import { usePagamentoSistema } from '../hooks/usePagamentoSistema'
import { diasParaVencimento, DIAS_LIMITE_VENCENDO } from '../utils'
import { CHAVE_PIX_SISTEMA, MENSAGEM_URGENCIA_SISTEMA } from '../constants'

export function PagamentoSistema() {
  const { data: info, isLoading } = usePagamentoSistema()
  const [copiado, setCopiado] = useState(false)

  function copiarChavePix() {
    navigator.clipboard.writeText(CHAVE_PIX_SISTEMA.replace(/\D/g, ''))
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  if (isLoading || !info) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }

  const bloqueada = info.statusAssinatura === 'bloqueada'
  const dias = diasParaVencimento(info.vencimentoMensalidade)
  const vencida = dias != null && dias < 0
  const vencendoEmBreve = dias != null && dias >= 0 && dias <= DIAS_LIMITE_VENCENDO

  const urgente = bloqueada || vencida || vencendoEmBreve

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-2.5">
        <div className={`flex items-center justify-center size-10 rounded-lg shrink-0 ${urgente ? 'bg-red-500/10 text-red-600' : 'bg-primary/10 text-primary'}`}>
          {urgente ? <ShieldAlert size={20} /> : <ShieldCheck size={20} />}
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Pagamento do Sistema</h1>
          <p className="text-sm text-muted-foreground">Mensalidade de uso do sistema — não confundir com o financeiro da sua oficina.</p>
        </div>
      </div>

      {bloqueada && (
        <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/30 p-4 space-y-1">
          <p className="font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
            <ShieldAlert size={16} /> Acesso bloqueado
          </p>
          <p className="text-sm text-red-700/90 dark:text-red-400/90">
            {info.bloqueadaMotivo || 'O acesso está temporariamente bloqueado.'} Regularize o pagamento pra voltar a usar o sistema normalmente.
          </p>
        </div>
      )}

      {!bloqueada && vencida && (
        <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/30 p-4">
          <p className="font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
            <AlertTriangle size={16} /> Mensalidade vencida há {Math.abs(dias!)} dia{Math.abs(dias!) === 1 ? '' : 's'}
          </p>
          <p className="text-sm text-red-700/90 dark:text-red-400/90 mt-1">Regularize o quanto antes pra evitar o bloqueio do acesso.</p>
        </div>
      )}

      {!bloqueada && !vencida && vencendoEmBreve && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-4">
          <p className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2">
            <AlertTriangle size={16} /> {dias === 0 ? 'Vence hoje' : `Vence em ${dias} dia${dias === 1 ? '' : 's'}`}
          </p>
          <p className="text-sm text-amber-700/90 dark:text-amber-400/90 mt-1">Adiante o pagamento pra não correr o risco de ficar sem acesso.</p>
        </div>
      )}

      {!bloqueada && !vencida && !vencendoEmBreve && (
        <div className="rounded-lg border border-green-300 bg-green-50 dark:bg-green-950/30 p-4">
          <p className="font-semibold text-green-700 dark:text-green-400 flex items-center gap-2">
            <ShieldCheck size={16} /> Pagamento em dia
          </p>
        </div>
      )}

      <div className="rounded-lg border bg-card shadow-sm p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center size-8 rounded-md bg-primary/10 text-primary shrink-0">
              <Calendar size={16} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Data de vencimento</p>
              <p className="text-lg font-semibold">
                {info.vencimentoMensalidade ? formatDate(info.vencimentoMensalidade) : 'Ainda não definida — fale com o suporte'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center size-8 rounded-md bg-primary/10 text-primary shrink-0">
              <Wallet size={16} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Valor da mensalidade</p>
              <p className="text-lg font-semibold">
                {info.valorMensalidade != null ? formatCurrency(info.valorMensalidade) : 'Fale com o suporte'}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t pt-4 space-y-2">
          <p className="text-xs text-muted-foreground">Pague via PIX com a chave abaixo</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-11 rounded-md border bg-muted/30 px-3 flex items-center font-mono text-sm">{CHAVE_PIX_SISTEMA}</div>
            <button
              type="button"
              onClick={copiarChavePix}
              className="h-11 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center gap-1.5 shrink-0"
            >
              {copiado ? <Check size={15} /> : <Copy size={15} />}
              {copiado ? 'Copiado!' : 'Copiar chave'}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Depois de pagar, envie o comprovante pra confirmar e regularizar o acesso.</p>
        </div>
      </div>

      <div className={`rounded-lg p-4 text-center font-semibold ${urgente ? 'bg-red-600 text-white' : 'bg-muted text-muted-foreground'}`}>
        {MENSAGEM_URGENCIA_SISTEMA}
      </div>
    </div>
  )
}
