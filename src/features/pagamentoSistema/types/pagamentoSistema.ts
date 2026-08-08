export interface InfoPagamentoSistema {
  nomeFantasia: string | null
  vencimentoMensalidade: string | null
  statusAssinatura: 'ativa' | 'bloqueada'
  bloqueadaMotivo: string | null
}
