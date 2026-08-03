import type { VeiculoCsvRow } from '../types/importacao'

const HEADER_MAP: Record<string, keyof Omit<VeiculoCsvRow, 'linha'>> = {
  placa: 'placa',
  modelo: 'modelo',
  marca: 'marca',
  cor: 'cor',
  ano: 'ano',
  ano_modelo: 'anoModelo',
  anomodelo: 'anoModelo',
  chassi: 'chassi',
  km: 'kmAtual',
  km_atual: 'kmAtual',
  kmatual: 'kmAtual',
  cliente_cpf_cnpj: 'clienteCpfCnpj',
  clientecpfcnpj: 'clienteCpfCnpj',
  cpf_cnpj: 'clienteCpfCnpj',
  cpfcnpj: 'clienteCpfCnpj',
  cliente_nome: 'clienteNome',
  clientenome: 'clienteNome',
  cliente: 'clienteNome',
  observacoes: 'observacoes',
  observacao: 'observacoes',
}

function normalizarCabecalho(valor: string): string {
  return valor
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '_')
}

function dividirLinhaCsv(linha: string, separador: string): string[] {
  const campos: string[] = []
  let atual = ''
  let dentroDeAspas = false

  for (let i = 0; i < linha.length; i++) {
    const char = linha[i]

    if (char === '"') {
      if (dentroDeAspas && linha[i + 1] === '"') {
        atual += '"'
        i++
      } else {
        dentroDeAspas = !dentroDeAspas
      }
      continue
    }

    if (char === separador && !dentroDeAspas) {
      campos.push(atual)
      atual = ''
      continue
    }

    atual += char
  }

  campos.push(atual)
  return campos.map((campo) => campo.trim())
}

function detectarSeparador(linhaCabecalho: string): string {
  return linhaCabecalho.includes(';') && !linhaCabecalho.includes(',') ? ';' : ','
}

export interface CsvParseResult {
  linhas: VeiculoCsvRow[]
  colunasReconhecidas: number
}

export function parseCsvVeiculos(conteudo: string): CsvParseResult {
  const linhasBrutas = conteudo.split(/\r\n|\n|\r/).filter((linha) => linha.trim().length > 0)

  if (linhasBrutas.length === 0) {
    return { linhas: [], colunasReconhecidas: 0 }
  }

  const separador = detectarSeparador(linhasBrutas[0])
  const cabecalhos = dividirLinhaCsv(linhasBrutas[0], separador).map(normalizarCabecalho)
  const chaves = cabecalhos.map((cabecalho) => HEADER_MAP[cabecalho])
  const colunasReconhecidas = chaves.filter(Boolean).length

  const linhas: VeiculoCsvRow[] = linhasBrutas.slice(1).map((linhaBruta, index) => {
    const valores = dividirLinhaCsv(linhaBruta, separador)
    const linha: VeiculoCsvRow = { linha: index + 2 }

    chaves.forEach((chave, colunaIndex) => {
      if (!chave) return
      const valor = valores[colunaIndex]?.trim()
      if (valor) {
        linha[chave] = valor
      }
    })

    return linha
  })

  return { linhas, colunasReconhecidas }
}
