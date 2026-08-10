export interface InfoPagamentoSistema {
  nomeFantasia: string | null
  vencimentoMensalidade: string | null
  valorMensalidade: number | null
  statusAssinatura: 'ativa' | 'bloqueada'
  bloqueadaMotivo: string | null
}
