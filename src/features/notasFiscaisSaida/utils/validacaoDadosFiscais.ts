import type { ModeloNotaFiscal } from '../types/notaFiscalSaida'

// Mesmas exigências que os edge functions emitir-nota-fiscal/emitir-nfse já
// checam no servidor antes de montar o XML (ver comentários lá) — checadas
// de novo aqui, do lado do cliente, pra avisar ANTES de tentar emitir em vez
// de só depois que a Sefaz/Focus já rejeitou. Mantém as duas listas em
// sincronia se um dia mudar uma exigência de cadastro.
export interface DadosFiscaisCliente {
  cpfCnpj: string | null
  endereco: string | null
  bairro: string | null
  codigoCidade: string | null
  cep: string | null
}

export function validarClienteParaNota(cliente: DadosFiscaisCliente | null | undefined, modelo: ModeloNotaFiscal): string[] {
  if (!cliente) return ['cadastro do cliente']
  const problemas: string[] = []
  if (!cliente.cpfCnpj) problemas.push('CPF/CNPJ')
  if (!cliente.endereco) problemas.push('endereço (rua)')
  else if (cliente.endereco.length > 60) problemas.push('endereço muito longo (máx. 60 caracteres — a Sefaz rejeita)')
  if (!cliente.bairro) problemas.push('bairro')
  if (!cliente.codigoCidade) problemas.push('código do município')
  // CEP só é exigido pelo layout nacional de NFS-e — a NF-e de peças não
  // valida esse campo no edge function.
  if (modelo === 'servico') {
    const cepLimpo = (cliente.cep ?? '').replace(/\D/g, '')
    if (cepLimpo.length !== 8) problemas.push('CEP')
  }
  return problemas
}
