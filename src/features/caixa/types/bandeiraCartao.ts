export type GrupoTaxaMaquininha = 'mastercard' | 'outros'

export const ROTULO_GRUPO_TAXA_MAQUININHA: Record<GrupoTaxaMaquininha, string> = {
  mastercard: 'Mastercard',
  outros: 'Outros cartões',
}

export interface BandeiraCartao {
  id: string
  oficinaId: string
  nome: string
  grupoTaxa: GrupoTaxaMaquininha
  ativo: boolean
  createdAt: string
}
