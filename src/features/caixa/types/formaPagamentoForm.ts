import type { ContaBancaria } from './contaBancaria'
import type { Maquininha } from './maquininha'
import type { BandeiraCartao } from './bandeiraCartao'
import type { FormaPagamento, FormaPagamentoInput } from './caixa'

export interface FormaPagamentoForm {
  chave: string
  formaPagamento: FormaPagamento
  valor: string
  valorRecebido: string
  contaBancaria: ContaBancaria | null
  parcelas: string
  bandeira: BandeiraCartao | null
  maquininha: Maquininha | null
}

export function criarFormaPagamentoVazia(formaPagamento: FormaPagamento = 'pix'): FormaPagamentoForm {
  return {
    chave: crypto.randomUUID(),
    formaPagamento,
    valor: '',
    valorRecebido: '',
    contaBancaria: null,
    parcelas: '1',
    bandeira: null,
    maquininha: null,
  }
}

// Regra de parcelamento configurável em Configurações > Formas de Pagamento
// (padrão: acima de 6x aplica 8% de juros flat sobre o valor daquela forma).
export function calcularJurosPercentual(
  formaPagamento: FormaPagamento,
  parcelas: string,
  parcelasSemJuros = 6,
  jurosPercentual = 8,
): number {
  if (formaPagamento !== 'credito') return 0
  const numeroParcelas = Number(parcelas) || 1
  return numeroParcelas > parcelasSemJuros ? jurosPercentual : 0
}

export function calcularValorComJuros(forma: FormaPagamentoForm, parcelasSemJuros = 6, jurosPercentual = 8): number {
  const valor = Number(forma.valor) || 0
  const juros = calcularJurosPercentual(forma.formaPagamento, forma.parcelas, parcelasSemJuros, jurosPercentual)
  return valor * (1 + juros / 100)
}

export function calcularTroco(forma: FormaPagamentoForm): number {
  if (forma.formaPagamento !== 'dinheiro') return 0
  const valor = Number(forma.valor) || 0
  const recebido = Number(forma.valorRecebido) || 0
  return recebido > valor ? recebido - valor : 0
}

export function formaPagamentoParaInput(
  forma: FormaPagamentoForm,
  parcelasSemJuros = 6,
  jurosPercentual = 8,
): FormaPagamentoInput {
  return {
    formaPagamento: forma.formaPagamento,
    valor: Number(forma.valor) || 0,
    valorRecebido: forma.valorRecebido ? Number(forma.valorRecebido) : undefined,
    contaBancariaId: forma.contaBancaria?.id,
    parcelas: forma.formaPagamento === 'credito' ? Number(forma.parcelas) || 1 : undefined,
    bandeira: forma.bandeira?.nome || undefined,
    maquininha: forma.maquininha?.nome || undefined,
    jurosPercentual: calcularJurosPercentual(forma.formaPagamento, forma.parcelas, parcelasSemJuros, jurosPercentual) || undefined,
  }
}
