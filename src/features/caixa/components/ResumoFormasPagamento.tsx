import { usePermissions } from '@/hooks/usePermissions'
import { formatCurrency } from '@/utils/format'
import { cn } from '@/lib/utils'
import type { DashboardCaixa } from '../types/caixa'

interface ResumoFormasPagamentoProps {
  data: DashboardCaixa
  rotuloRecebido?: string
  rotuloQuantidade?: string
  rotuloDescontos?: string
}

// Detalhamento de "como foi cada pagamento" (por forma, perda com
// maquininha e lucro) — usado tanto no Resumo do Caixa quanto no Dashboard
// Financeiro, pra não duplicar essa lógica/rótulos nos dois lugares.
export function ResumoFormasPagamento({
  data,
  rotuloRecebido = 'Total Recebido',
  rotuloQuantidade = 'Qtd. OS recebidas',
  rotuloDescontos = 'Descontos',
}: ResumoFormasPagamentoProps) {
  // Mesma permissão já usada pra mostrar lucro no fechamento de caixa
  // (FecharCaixaModal) e na OS (ItemOrdemRow/OrdemForm) — ordens.visualizar_lucro.
  const { hasPermission } = usePermissions()
  const podeVerLucro = hasPermission('ordens.visualizar_lucro')

  return (
    <div className="space-y-2 text-sm">
      <Linha label={rotuloRecebido} valor={formatCurrency(data.recebidoHoje)} destaque />
      <Linha label="PIX" valor={formatCurrency(data.recebidoPix)} />
      <Linha label="Dinheiro" valor={formatCurrency(data.recebidoDinheiro)} />
      <Linha label="Débito" valor={formatCurrency(data.recebidoDebito)} />
      <Linha label="Crédito" valor={formatCurrency(data.recebidoCredito)} />
      <Linha label="Boleto" valor={formatCurrency(data.recebidoBoleto)} />
      <div className="border-t pt-2 mt-2">
        <Linha label={rotuloDescontos} valor={formatCurrency(data.descontosHoje)} />
        <Linha label="Pendentes" valor={String(data.pendentes)} />
        <Linha label={rotuloQuantidade} valor={String(data.quantidadeOs)} />
      </div>
      <div className="border-t pt-2 mt-2">
        <Linha label="Total Geral" valor={formatCurrency(data.totalGeral)} destaque cor="text-primary" />
      </div>
      {(data.perdaDebito > 0 || data.perdaParcelamentoCredito > 0) && (
        <div className="border-t pt-2 mt-2">
          {data.perdaDebito > 0 && <Linha label="Perda com taxa do débito" valor={formatCurrency(data.perdaDebito)} cor="text-destructive" />}
          {data.perdaParcelamentoCredito > 0 && (
            <Linha label="Perda com parcelamento (crédito)" valor={formatCurrency(data.perdaParcelamentoCredito)} cor="text-destructive" />
          )}
          {data.perdaDebito > 0 && data.perdaParcelamentoCredito > 0 && (
            <Linha
              label="Perda total com maquininha"
              valor={formatCurrency(data.perdaDebito + data.perdaParcelamentoCredito)}
              destaque
              cor="text-destructive"
            />
          )}
          {(data.vendasCreditoSemTaxaConfigurada > 0 || data.vendasDebitoSemTaxaConfigurada > 0) && (
            <p className="text-xs text-muted-foreground mt-1">
              {data.vendasCreditoSemTaxaConfigurada + data.vendasDebitoSemTaxaConfigurada} venda
              {data.vendasCreditoSemTaxaConfigurada + data.vendasDebitoSemTaxaConfigurada === 1 ? '' : 's'} ficaram de fora dessa conta
              por falta de taxa cadastrada pra bandeira/parcela.
            </p>
          )}
        </div>
      )}
      {podeVerLucro && (
        <div className="border-t pt-2 mt-2">
          <Linha label="Lucro Bruto" valor={formatCurrency(data.lucroBruto)} />
          <Linha label="Lucro Líquido (após taxa da maquininha)" valor={formatCurrency(data.lucroLiquido)} destaque cor="text-primary" />
        </div>
      )}
    </div>
  )
}

function Linha({ label, valor, destaque, cor }: { label: string; valor: string; destaque?: boolean; cor?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn(destaque && 'font-semibold', cor)}>{valor}</span>
    </div>
  )
}
