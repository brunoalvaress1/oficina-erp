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

// Endereço formatado em uma linha só, pro cabeçalho dos PDFs impressos
// (OS, fechamento de caixa) — usado no lugar do nome da oficina, que já
// aparece pela logo.
export function formatarEnderecoOficina(
  oficina: Pick<DadosOficina, 'endereco' | 'numero' | 'bairro' | 'cidade' | 'estado' | 'cep'> | null | undefined,
): string | null {
  if (!oficina) return null
  const rua = [oficina.endereco, oficina.numero].filter(Boolean).join(', ')
  const cidadeUf = [oficina.cidade, oficina.estado].filter(Boolean).join('/')
  const partes = [rua, oficina.bairro, cidadeUf, oficina.cep ? `CEP ${oficina.cep}` : null].filter(Boolean)
  return partes.length > 0 ? partes.join(' - ') : null
}
