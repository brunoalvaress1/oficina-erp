import type { Veiculo, VeiculoInput } from '@/features/veiculos/types/veiculo'
import type { Cliente, ClienteInput } from '@/features/clientes/types/cliente'
import { buscarEnderecoPorCep } from '@/utils/cep'

export interface VeiculoBlockValue {
  veiculoExistente: Veiculo | null
  placa: string
  marca: string
  modelo: string
  cor: string
  ano: string
  anoModelo: string
  chassi: string
  motor: string
  combustivel: string
  opcionais: string
}

export function veiculoBlockValueVazio(): VeiculoBlockValue {
  return {
    veiculoExistente: null,
    placa: '',
    marca: '',
    modelo: '',
    cor: '',
    ano: '',
    anoModelo: '',
    chassi: '',
    motor: '',
    combustivel: '',
    opcionais: '',
  }
}

export function veiculoBlockValueDoExistente(veiculo: Veiculo): VeiculoBlockValue {
  return {
    veiculoExistente: veiculo,
    placa: veiculo.placa,
    marca: veiculo.marca ?? '',
    modelo: veiculo.modelo,
    cor: veiculo.cor ?? '',
    ano: veiculo.ano ?? '',
    anoModelo: veiculo.anoModelo ?? '',
    chassi: veiculo.chassi ?? '',
    motor: veiculo.motor ?? '',
    combustivel: veiculo.combustivel ?? '',
    opcionais: veiculo.opcionais ?? '',
  }
}

// Veículo é opcional (oficina não usa PDV, então nem toda OS tem um veículo
// associado) — mas se a placa foi preenchida, o modelo também precisa ser
// (não dá pra salvar uma placa "solta" sem identificar o veículo).
export function veiculoBlockValueValido(valor: VeiculoBlockValue): boolean {
  if (!valor.placa.trim()) return true
  return Boolean(valor.modelo.trim())
}

export function veiculoBlockValueInformado(valor: VeiculoBlockValue): boolean {
  return Boolean(valor.placa.trim())
}

export function veiculoBlockValueParaInput(valor: VeiculoBlockValue, clienteId: string): VeiculoInput {
  return {
    clienteId,
    placa: valor.placa.toUpperCase().replace(/[^A-Z0-9]/g, ''),
    marca: valor.marca || undefined,
    modelo: valor.modelo,
    cor: valor.cor || undefined,
    ano: valor.ano || undefined,
    anoModelo: valor.anoModelo || undefined,
    chassi: valor.chassi || undefined,
    motor: valor.motor || undefined,
    combustivel: valor.combustivel || undefined,
    opcionais: valor.opcionais || undefined,
  }
}

export interface ClienteBlockValue {
  clienteExistente: Cliente | null
  cpfCnpj: string
  nome: string
  telefone: string
  email: string
  cep: string
  endereco: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  codigoCidade: string
  sexo: string
  dataNascimento: string
  inscricaoEstadual: string
}

export function clienteBlockValueVazio(): ClienteBlockValue {
  return {
    clienteExistente: null,
    cpfCnpj: '',
    nome: '',
    telefone: '',
    email: '',
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    codigoCidade: '',
    sexo: '',
    dataNascimento: '',
    inscricaoEstadual: '',
  }
}

export function clienteBlockValueDoExistente(cliente: Cliente): ClienteBlockValue {
  return {
    clienteExistente: cliente,
    cpfCnpj: cliente.cpfCnpj ?? '',
    nome: cliente.nome,
    telefone: cliente.telefone ?? '',
    email: cliente.email ?? '',
    cep: cliente.cep ?? '',
    endereco: cliente.endereco ?? '',
    numero: cliente.numero ?? '',
    complemento: '',
    bairro: cliente.bairro ?? '',
    cidade: cliente.cidade ?? '',
    estado: cliente.estado ?? '',
    codigoCidade: cliente.codigoCidade ?? '',
    sexo: cliente.sexo ?? '',
    dataNascimento: cliente.dataNascimento ?? '',
    inscricaoEstadual: cliente.inscricaoEstadual ?? '',
  }
}

// CPF/CNPJ inválido não bloqueia salvar a OS aqui (só mostra aviso no campo)
// — é comum precisar abrir a ordem mesmo sem ter o documento certo do
// cliente em mãos ainda. O bloqueio de verdade fica no cadastro de Clientes
// (ClienteForm), que é onde um CPF errado deveria ser pego antes de tudo.
export function clienteBlockValueValido(valor: ClienteBlockValue): boolean {
  return Boolean(valor.nome.trim() && valor.codigoCidade.trim())
}

// Assinatura de um import antigo em CSV: o bairro nunca foi separado, ficou
// colado dentro do próprio campo de endereço junto com o número (ex: "Rua X,
// 130, Jardim Y" ou só "Rua X, Jardim Y"). Detecta pela vírgula e separa —
// bairro é sempre o último pedaço, o primeiro é a rua, e um pedaço do meio só
// vira número se for puramente numérico (o resto que sobrar, tipo "Até
// 1730/1731", vai pro complemento em vez de se perder). Só mexe quando o
// bairro está vazio — nunca risco de estragar um cadastro que já está correto.
export function separarEnderecoConcatenado(valor: ClienteBlockValue): Partial<ClienteBlockValue> | null {
  if (valor.bairro.trim()) return null
  const partes = valor.endereco
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
  if (partes.length < 2) return null

  const bairro = partes[partes.length - 1]
  const rua = partes[0]
  const meio = partes.slice(1, -1)
  const numeroExtraido = !valor.numero.trim() ? meio.find((p) => /^\d+$/.test(p)) : undefined
  const resto = meio.filter((p) => p !== numeroExtraido)

  return {
    endereco: rua,
    bairro,
    numero: numeroExtraido || valor.numero,
    complemento: resto.length > 0 ? [valor.complemento, resto.join(', ')].filter(Boolean).join(' - ') : valor.complemento,
  }
}

// Completa/corrige um endereço incompleto ou malformado (comum em cadastros
// antigos importados) em duas etapas: primeiro tenta separar um endereço
// concatenado (sem precisar de rede); se ainda faltar algo e tiver um CEP
// válido salvo, completa pela API de CEP. Em qualquer caso só preenche o que
// está vazio, nunca sobrescreve um valor que já existe — usado tanto ao
// carregar um cliente já cadastrado (CPF, busca por nome) quanto ao abrir uma
// OS já existente que referencia esse cliente.
export async function completarEnderecoCliente(valor: ClienteBlockValue): Promise<ClienteBlockValue> {
  let atual = valor

  const separado = separarEnderecoConcatenado(atual)
  if (separado) atual = { ...atual, ...separado }

  const enderecoIncompleto = !atual.endereco.trim() || !atual.bairro.trim() || !atual.codigoCidade.trim()
  const cepLimpo = atual.cep.replace(/\D/g, '')
  if (!enderecoIncompleto || cepLimpo.length !== 8) return atual

  const endereco = await buscarEnderecoPorCep(cepLimpo)
  if (!endereco) return atual
  return {
    ...atual,
    endereco: atual.endereco.trim() || endereco.endereco,
    bairro: atual.bairro.trim() || endereco.bairro,
    cidade: atual.cidade.trim() || endereco.cidade,
    estado: atual.estado.trim() || endereco.estado,
    codigoCidade: atual.codigoCidade.trim() || endereco.codigoCidade,
  }
}

export function clienteBlockValueParaInput(valor: ClienteBlockValue): ClienteInput {
  return {
    nome: valor.nome,
    cpfCnpj: valor.cpfCnpj || undefined,
    telefone: valor.telefone || undefined,
    email: valor.email || undefined,
    cep: valor.cep || undefined,
    endereco: valor.endereco || undefined,
    numero: valor.numero || undefined,
    bairro: valor.bairro || undefined,
    cidade: valor.cidade || undefined,
    estado: valor.estado || undefined,
    codigoCidade: valor.codigoCidade || undefined,
    sexo: valor.sexo || undefined,
    dataNascimento: valor.dataNascimento || undefined,
    observacoes: valor.complemento ? `Complemento: ${valor.complemento}` : undefined,
    inscricaoEstadual: valor.inscricaoEstadual || undefined,
  }
}
