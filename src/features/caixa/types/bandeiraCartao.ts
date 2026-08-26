export type GrupoTaxaMaquininha = 'mastercard' | 'outros'

// O grupo "mastercard" cobre Mastercard e Visa (mesma taxa negociada com a
// adquirente) — o rótulo deixa isso explícito pra não parecer engano quando
// o Visa aparecer marcado nesse grupo.
export const ROTULO_GRUPO_TAXA_MAQUININHA: Record<GrupoTaxaMaquininha, string> = {
  mastercard: 'Mastercard / Visa',
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
