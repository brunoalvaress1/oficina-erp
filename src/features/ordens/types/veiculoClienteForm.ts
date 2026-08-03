import type { Veiculo, VeiculoInput } from '@/features/veiculos/types/veiculo'
import type { Cliente, ClienteInput } from '@/features/clientes/types/cliente'

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

export function veiculoBlockValueValido(valor: VeiculoBlockValue): boolean {
  return Boolean(valor.placa.trim() && valor.modelo.trim())
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
  }
}

export function clienteBlockValueValido(valor: ClienteBlockValue): boolean {
  return Boolean(valor.nome.trim() && valor.codigoCidade.trim())
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
  }
}
