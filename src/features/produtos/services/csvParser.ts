import type { ProdutoCsvRow } from '../types/importacaoProduto'

// Aceita tanto o cabeçalho "limpo" (nome, valor_os, ...) quanto os cabeçalhos
// do sistema legado, que já variaram de formato mais de uma vez:
//   v1: Nome interno, Valor O.S, Valor PDV, Est. Virtual, Est. Fís., NCM
//   v2: Nome interno, Nome externo, Código Fabricante, Código interno,
//       Categoria, Subcategoria, Marca, Valor Custo, Valor O.S
// (Valor PDV não é mais um campo do sistema — se aparecer em algum arquivo
// legado, a coluna é simplesmente ignorada.)
// "Nome externo" vem depois de "Nome interno" na planilha e o forEach abaixo
// processa as colunas em ordem, então quando as duas existirem o externo
// (mais confiável, sem lixo de compatibilidade de veículo colado) vence.
const HEADER_MAP: Record<string, keyof Omit<ProdutoCsvRow, 'linha'>> = {
  nome: 'nome',
  nome_interno: 'nome',
  nome_externo: 'nome',
  categoria: 'categoria',
  subcategoria: 'subcategoria',
  marca: 'marca',
  codigo_fabricante: 'codigoFabricante',
  codigo_interno: 'codigoInterno',
  valor_custo: 'valorCusto',
  valor_os: 'valorOs',
  'valor_o.s': 'valorOs',
  estoque_fisico: 'estoqueFisico',
  'est._fisico': 'estoqueFisico',
  'est._fis.': 'estoqueFisico',
  ncm: 'ncm',
  observacoes: 'observacoes',
  observacao: 'observacoes',
}

const DIACRITICOS_REGEX = new RegExp('[\\u0300-\\u036f]', 'g')

function normalizarCabecalho(valor: string): string {
  return valor
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICOS_REGEX, '')
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
  linhas: ProdutoCsvRow[]
  colunasReconhecidas: number
}

export function parseCsvProdutos(conteudo: string): CsvParseResult {
  const linhasBrutas = conteudo.split(/\r\n|\n|\r/).filter((linha) => linha.trim().length > 0)

  if (linhasBrutas.length === 0) {
    return { linhas: [], colunasReconhecidas: 0 }
  }

  const separador = detectarSeparador(linhasBrutas[0])
  const cabecalhos = dividirLinhaCsv(linhasBrutas[0], separador).map(normalizarCabecalho)
  const chaves = cabecalhos.map((cabecalho) => HEADER_MAP[cabecalho])
  const colunasReconhecidas = chaves.filter(Boolean).length

  const linhas: ProdutoCsvRow[] = linhasBrutas.slice(1).map((linhaBruta, index) => {
    const valores = dividirLinhaCsv(linhaBruta, separador)
    const linha: ProdutoCsvRow = { linha: index + 2 }

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
