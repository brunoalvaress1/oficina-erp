export interface VeiculoCsvRow {
  linha: number
  placa?: string
  modelo?: string
  marca?: string
  cor?: string
  ano?: string
  anoModelo?: string
  chassi?: string
  kmAtual?: string
  clienteCpfCnpj?: string
  clienteNome?: string
  observacoes?: string
}

export type StatusLinhaImportacao = 'valido' | 'erro' | 'duplicado'

export interface LinhaImportacaoPreview {
  linha: number
  dados: VeiculoCsvRow
  status: StatusLinhaImportacao
  erros: string[]
  clienteId?: string
  clienteNomeResolvido?: string
}

export interface ResultadoImportacao {
  totalLinhas: number
  importados: number
  falhas: number
  erros: { linha: number; mensagem: string }[]
}
