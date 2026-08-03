export type RegimeTributario = 'simples_nacional' | 'lucro_presumido' | 'lucro_real'

export const ROTULO_REGIME_TRIBUTARIO: Record<RegimeTributario, string> = {
  simples_nacional: 'Simples Nacional',
  lucro_presumido: 'Lucro Presumido',
  lucro_real: 'Lucro Real',
}

export interface DadosOficina {
  id: string
  nomeFantasia: string | null
  razaoSocial: string | null
  cnpj: string | null
  inscricaoEstadual: string | null
  regimeTributario: RegimeTributario | null
  telefone: string | null
  whatsapp: string | null
  email: string | null
  cep: string | null
  endereco: string | null
  numero: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
  codigoMunicipio: string | null
  logoUrl: string | null
  site: string | null
  instagram: string | null
  facebook: string | null
  horarioFuncionamento: string | null
  observacoes: string | null
  nomeImpressao: string | null
  rodapeImpressao: string | null
  mensagemAgradecimento: string | null
  mensagemOs: string | null
  mensagemWhatsappPadrao: string | null
}

export type DadosOficinaInput = Omit<DadosOficina, 'id'>
