import type { FormaPagamento } from '@/features/caixa/types/caixa'
import type { GrupoTaxaMaquininha } from '@/features/caixa/types/bandeiraCartao'

export type TipoTaxaMaquininha = 'debito' | 'credito'

export interface TaxaMaquininha {
  id: string
  oficinaId: string
  grupoTaxa: GrupoTaxaMaquininha
  tipo: TipoTaxaMaquininha
  parcelas: number
  taxaPercentual: number
}

export interface FormaPagamentoConfig {
  codigo: FormaPagamento
  oficinaId: string
  nomeExibicao: string | null
  icone: string | null
  cor: string | null
  taxaPercentual: number
  prazoRecebimentoDias: number
  contaBancariaPadraoId: string | null
  contaBancariaPadraoNome?: string | null
  ativo: boolean
}

export interface FormaPagamentoConfigInput {
  nomeExibicao?: string
  icone?: string
  cor?: string
  taxaPercentual?: number
  prazoRecebimentoDias?: number
  contaBancariaPadraoId?: string | null
  ativo?: boolean
}

export interface ConfiguracaoParcelamento {
  id: string
  oficinaId: string
  parcelasSemJuros: number
  jurosPercentual: number
}
