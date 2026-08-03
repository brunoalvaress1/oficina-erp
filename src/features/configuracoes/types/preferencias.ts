export interface PreferenciaFuncionario {
  funcionarioId: string
  tema: 'claro' | 'escuro' | 'sistema' | null
  itensPorPagina: number
  telaInicial: string | null
  salvarFiltros: boolean
}

export interface ConfiguracaoImpressao {
  oficinaId: string
  tamanhoPapel: 'A4' | 'A5' | 'bobina'
  margemMm: number
  impressoraPadrao: string | null
}

export interface ConfiguracaoNumeracao {
  oficinaId: string
  prefixoOs: string | null
  prefixoNf: string | null
  paddingDigitos: number
}
