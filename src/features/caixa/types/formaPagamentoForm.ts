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
  // Vazio = usa a regra automática (parcelasSemJuros/jurosPercentual de
  // Configurações). Preenchido = o vendedor decidiu na hora repassar uma
  // taxa diferente da maquininha pro cliente (inclusive "0" pra passar sem
  // juros mesmo parcelando acima do limite configurado).
  jurosManual: string
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
    jurosManual: '',
  }
}

// Regra de parcelamento configurável em Configurações > Formas de Pagamento
// (padrão: acima de 6x aplica 8% de juros flat sobre o valor daquela forma)
// — mas o vendedor pode sobrescrever na hora (jurosManual), pra repassar a
// taxa real da maquininha em vez do percentual padrão, ou não repassar juros
// nenhum mesmo parcelando bastante.
export function calcularJurosPercentual(
  formaPagamento: FormaPagamento,
  parcelas: string,
  parcelasSemJuros = 6,
  jurosPercentual = 8,
  jurosManual?: string,
): number {
  if (formaPagamento !== 'credito') return 0
  if (jurosManual != null && jurosManual.trim() !== '') return Number(jurosManual) || 0
  const numeroParcelas = Number(parcelas) || 1
  return numeroParcelas > parcelasSemJuros ? jurosPercentual : 0
}

export function calcularValorComJuros(forma: FormaPagamentoForm, parcelasSemJuros = 6, jurosPercentual = 8): number {
  const valor = Number(forma.valor) || 0
  const juros = calcularJurosPercentual(forma.formaPagamento, forma.parcelas, parcelasSemJuros, jurosPercentual, forma.jurosManual)
  return valor * (1 + juros / 100)
}

// Valor de cada parcela — considerando os juros aplicados (automático ou
// sobrescrito), pra mostrar "8x de R$ 125,00" na hora de escolher.
export function calcularValorPorParcela(forma: FormaPagamentoForm, parcelasSemJuros = 6, jurosPercentual = 8): number {
  const numeroParcelas = Number(forma.parcelas) || 1
  return calcularValorComJuros(forma, parcelasSemJuros, jurosPercentual) / numeroParcelas
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
    jurosPercentual:
      calcularJurosPercentual(forma.formaPagamento, forma.parcelas, parcelasSemJuros, jurosPercentual, forma.jurosManual) || undefined,
  }
}
