import { readFileSync, writeFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const OFICINA_ID = process.env.OFICINA_ID

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !OFICINA_ID) {
  console.error('Defina SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e OFICINA_ID (use .env.migracao)')
  process.exit(1)
}

const commit = process.argv.includes('--commit')
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

function dividirLinhaCsv(linha) {
  const campos = []
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
    if (char === ',' && !dentroDeAspas) {
      campos.push(atual)
      atual = ''
      continue
    }
    atual += char
  }
  campos.push(atual)
  return campos
}

function limparCodigo(valor) {
  const texto = (valor ?? '').trim()
  if (!texto || texto.toUpperCase() === 'N/A') return null
  return texto
}

function limparTexto(valor) {
  const texto = (valor ?? '').trim()
  return texto || null
}

function parseMoedaBr(valor) {
  if (!valor) return 0
  const limpo = valor.replace(/[^0-9,.-]/g, '')
  const semSeparadorDeMilhar = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo
  const numero = Number.parseFloat(semSeparadorDeMilhar)
  return Number.isFinite(numero) ? numero : 0
}

function normalizarNome(nome) {
  return nome.trim().toLowerCase().replace(/\s+/g, ' ')
}

// Colunas: ID, Nome interno, Nome externo, Código Fabricante, Código interno,
// Categoria, Subcategoria, Marca, Valor Custo, Valor O.S — mas o arquivo é "torto":
// várias linhas não têm Valor Custo/Valor O.S no final (0, 1 ou 2 campos a menos).
function parseLinha(linha) {
  const campos = dividirLinhaCsv(linha)
  const [, nomeInterno, nomeExterno, codigoFabricante, codigoInterno, categoria, subcategoria, marca, valorCusto, valorOs] = campos
  const nome = limparTexto(nomeExterno) ?? limparTexto(nomeInterno)
  return {
    nome,
    categoria: limparTexto(categoria),
    subcategoria: limparTexto(subcategoria),
    marca: limparTexto(marca),
    codigoFabricante: limparCodigo(codigoFabricante),
    codigoInterno: limparCodigo(codigoInterno),
    valorCusto: parseMoedaBr(valorCusto),
    valorOs: parseMoedaBr(valorOs),
  }
}

async function buscarNomesExistentes() {
  const nomes = new Set()
  let from = 0
  const tamanhoLote = 1000
  while (true) {
    const { data, error } = await supabase.from('produtos').select('nome').range(from, from + tamanhoLote - 1)
    if (error) throw new Error(error.message)
    for (const row of data) nomes.add(normalizarNome(row.nome))
    if (data.length < tamanhoLote) break
    from += tamanhoLote
  }
  return nomes
}

async function main() {
  console.log(`Modo: ${commit ? 'COMMIT' : 'DRY-RUN'}`)

  const conteudo = readFileSync(new URL('../produtos.csv', import.meta.url), 'utf8')
  const linhas = conteudo.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0)
  const [, ...dados] = linhas

  const nomesExistentes = await buscarNomesExistentes()
  console.log('Produtos já existentes no banco:', nomesExistentes.size)

  const paraImportar = []
  const semNome = []
  const duplicadosNoArquivo = []
  const jaExistentes = []
  const nomesVistos = new Set()

  for (const [index, linha] of dados.entries()) {
    const produto = parseLinha(linha)
    const numeroLinha = index + 2

    if (!produto.nome) {
      semNome.push(numeroLinha)
      continue
    }

    const chave = normalizarNome(produto.nome)

    if (nomesExistentes.has(chave)) {
      jaExistentes.push({ linha: numeroLinha, nome: produto.nome })
      continue
    }
    if (nomesVistos.has(chave)) {
      duplicadosNoArquivo.push({ linha: numeroLinha, nome: produto.nome })
      continue
    }
    nomesVistos.add(chave)
    paraImportar.push(produto)
  }

  console.log('Total de linhas no arquivo:', dados.length)
  console.log('Sem nome (ignoradas):', semNome.length)
  console.log('Já existentes no banco (ignoradas):', jaExistentes.length)
  console.log('Duplicadas dentro do arquivo (ignoradas, mantida a primeira ocorrência):', duplicadosNoArquivo.length)
  console.log('Serão importados:', paraImportar.length)

  let importados = 0
  const erros = []

  if (commit) {
    const tamanhoLote = 200
    for (let i = 0; i < paraImportar.length; i += tamanhoLote) {
      const lote = paraImportar.slice(i, i + tamanhoLote).map((produto) => ({
        oficina_id: OFICINA_ID,
        nome: produto.nome,
        categoria: produto.categoria,
        subcategoria: produto.subcategoria,
        marca: produto.marca,
        codigo_fabricante: produto.codigoFabricante,
        codigo_interno: produto.codigoInterno,
        valor_custo: produto.valorCusto,
        valor_os: produto.valorOs,
        valor_pdv: 0,
        estoque_fisico: 0,
      }))
      const { error, data } = await supabase.from('produtos').insert(lote).select('id')
      if (error) {
        erros.push({ lote: i / tamanhoLote + 1, mensagem: error.message })
      } else {
        importados += data.length
      }
    }
  }

  const relatorio = [
    `Modo: ${commit ? 'COMMIT' : 'DRY-RUN'}`,
    `Total de linhas no arquivo: ${dados.length}`,
    `Sem nome (ignoradas): ${semNome.length}`,
    `Já existentes no banco (ignoradas): ${jaExistentes.length}`,
    `Duplicadas dentro do arquivo (ignoradas): ${duplicadosNoArquivo.length}`,
    `Planejados para importar: ${paraImportar.length}`,
    `Importados de fato: ${importados}`,
    `Erros: ${erros.length}`,
    '',
    '--- Amostra: a importar ---',
    ...paraImportar.slice(0, 15).map((p) => `${p.nome} | categoria=${p.categoria} marca=${p.marca} valorCusto=${p.valorCusto} valorOs=${p.valorOs} codFab=${p.codigoFabricante} codInt=${p.codigoInterno}`),
    '',
    '--- Erros ---',
    ...erros.map((e) => `Lote ${e.lote}: ${e.mensagem}`),
  ].join('\n')

  writeFileSync('relatorio-import-produtos.txt', relatorio, 'utf8')
  console.log('\nRelatório salvo em relatorio-import-produtos.txt')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
