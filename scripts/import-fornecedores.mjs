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

// O fornecedores.csv exportado do sistema legado veio com mojibake (UTF-8 lido
// como Latin-1). Reverte igual foi feito para clientes.csv/produtos.csv.
function corrigirMojibake(texto) {
  const corrigido = Buffer.from(texto, 'latin1').toString('utf8')
  // "Ímpar" perdeu o segundo byte (0x8D) antes mesmo de chegar até nós — sobrou só
  // "Ã" + "mpar", que vira "�mpar" ao reverter o mojibake. Sempre aparece como
  // "Lado �mpar" (endereço com numeração ímpar), então o reparo é seguro.
  return corrigido.replace(/�mpar/g, 'Ímpar')
}

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

function limparEspacos(texto) {
  return texto.replace(/\s+/g, ' ').trim()
}

function limparTexto(valor) {
  const texto = (valor ?? '').trim()
  if (!texto || texto === '---') return null
  return limparEspacos(texto)
}

function limparEmail(valor) {
  const texto = limparTexto(valor)
  return texto ? texto.toLowerCase() : null
}

// Alguns registros trazem dois telefones colados com dezenas de espaços entre
// eles (bug do sistema legado). Não descarta nenhum dos dois — só troca o
// espaçamento gigante por " / " pra ficar legível.
function limparTelefone(valor) {
  const texto = (valor ?? '').trim()
  if (!texto || texto === '---') return null
  return texto.replace(/\s{3,}/g, ' / ').replace(/\s+/g, ' ').trim()
}

const DIACRITICOS_REGEX = new RegExp('[\\u0300-\\u036f]', 'g')

function normalizarChave(texto) {
  return texto
    .normalize('NFD')
    .replace(DIACRITICOS_REGEX, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Nome bruto vem do sistema legado como "F" + Fantasia + espaços de preenchimento
// + "R" + Razão Social. Quando não há fantasia, o legado grava o texto literal
// "null" no lugar dela (em vez de deixar em branco).
const NOME_REGEX = /^F(.*?)\s{5,}R(.*)$/

function parseNomeFornecedor(nomeBruto) {
  const match = nomeBruto.match(NOME_REGEX)
  if (!match) {
    return { nome: limparEspacos(nomeBruto.replace(/^F/, '')), fantasia: null }
  }
  const fantasiaRaw = limparEspacos(match[1])
  const razaoSocial = limparEspacos(match[2])
  const fantasia = fantasiaRaw && fantasiaRaw.toLowerCase() !== 'null' ? fantasiaRaw : null
  return { nome: razaoSocial, fantasia }
}

function parseLinha(linha) {
  const campos = dividirLinhaCsv(linha)
  const [, , fornecedorRaw, documentoDigitos, , vendedor, endereco, email, telefone] = campos

  const { nome, fantasia } = parseNomeFornecedor(fornecedorRaw)
  const observacoes =
    fantasia && normalizarChave(fantasia) !== normalizarChave(nome) ? `Nome fantasia: ${fantasia}` : null

  const cnpjDigitos = (documentoDigitos ?? '').replace(/\D/g, '')

  return {
    nome,
    cnpjCpf: cnpjDigitos || null,
    vendedor: limparTexto(vendedor),
    endereco: limparTexto(endereco),
    email: limparEmail(email),
    telefone: limparTelefone(telefone),
    observacoes,
  }
}

async function main() {
  console.log(`Modo: ${commit ? 'COMMIT' : 'DRY-RUN'}`)

  const bruto = readFileSync(new URL('../fornecedores.csv', import.meta.url), 'utf8')
  const conteudo = corrigirMojibake(bruto)
  const linhas = conteudo.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0)
  const [, ...dados] = linhas

  const semNome = []
  const duplicadosNoArquivo = []
  const paraImportar = []
  const chavesVistas = new Set()

  for (const [index, linha] of dados.entries()) {
    const numeroLinha = index + 2
    const fornecedor = parseLinha(linha)

    if (!fornecedor.nome) {
      semNome.push(numeroLinha)
      continue
    }

    const chave = fornecedor.cnpjCpf ?? `nome:${normalizarChave(fornecedor.nome)}`

    if (chavesVistas.has(chave)) {
      duplicadosNoArquivo.push({ linha: numeroLinha, nome: fornecedor.nome })
      continue
    }
    chavesVistas.add(chave)
    paraImportar.push(fornecedor)
  }

  console.log('Total de linhas no arquivo:', dados.length)
  console.log('Sem nome (ignoradas):', semNome.length)
  console.log('Duplicadas dentro do arquivo (ignoradas, mantida a primeira ocorrência):', duplicadosNoArquivo.length)
  console.log('Serão importados:', paraImportar.length)

  let importados = 0
  const erros = []

  if (commit) {
    const tamanhoLote = 200
    for (let i = 0; i < paraImportar.length; i += tamanhoLote) {
      const lote = paraImportar.slice(i, i + tamanhoLote).map((fornecedor) => ({
        oficina_id: OFICINA_ID,
        nome: fornecedor.nome,
        cnpj_cpf: fornecedor.cnpjCpf,
        vendedor: fornecedor.vendedor,
        telefone: fornecedor.telefone,
        email: fornecedor.email,
        endereco: fornecedor.endereco,
        observacoes: fornecedor.observacoes,
      }))
      const { error, data } = await supabase.from('fornecedores').insert(lote).select('id')
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
    `Duplicadas dentro do arquivo (ignoradas): ${duplicadosNoArquivo.length}`,
    `Planejados para importar: ${paraImportar.length}`,
    `Importados de fato: ${importados}`,
    `Erros: ${erros.length}`,
    '',
    '--- Amostra: a importar (todos) ---',
    ...paraImportar.map(
      (f) =>
        `${f.nome} | cnpj=${f.cnpjCpf} vendedor=${f.vendedor} telefone=${f.telefone} email=${f.email} endereco=${f.endereco} obs=${f.observacoes}`,
    ),
    '',
    '--- Duplicadas no arquivo ---',
    ...duplicadosNoArquivo.map((d) => `Linha ${d.linha}: ${d.nome}`),
    '',
    '--- Erros ---',
    ...erros.map((e) => `Lote ${e.lote}: ${e.mensagem}`),
  ].join('\n')

  writeFileSync('relatorio-import-fornecedores.txt', relatorio, 'utf8')
  console.log('\nRelatório salvo em relatorio-import-fornecedores.txt')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
