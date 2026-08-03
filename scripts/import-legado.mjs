// Importa clientes e veículos a partir do export do sistema antigo (veiculos.csv).
//
// Uso:
//   node --env-file=.env.migracao scripts/import-legado.mjs                # dry-run (não grava nada)
//   node --env-file=.env.migracao scripts/import-legado.mjs --commit        # grava de verdade
//   node --env-file=.env.migracao scripts/import-legado.mjs --arquivo=outro.csv
//
// Variáveis obrigatórias em .env.migracao:
//   SUPABASE_URL=https://SEU-PROJETO.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY=...   (Project Settings > API > service_role — NUNCA usar no frontend)
//   OFICINA_ID=...                  (uuid da oficina; rode `select id, nome from oficinas;` no SQL Editor)

import { readFileSync, writeFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const args = process.argv.slice(2)
const commit = args.includes('--commit')
const arquivoArg = args.find((a) => a.startsWith('--arquivo='))
const caminhoArquivo = arquivoArg ? arquivoArg.split('=')[1] : 'veiculos.csv'

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OFICINA_ID } = process.env

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !OFICINA_ID) {
  console.error(
    'Defina SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e OFICINA_ID (veja o topo deste arquivo) e rode com --env-file=.env.migracao',
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

function normalizarNome(nome) {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

function normalizarDocumento(doc) {
  return doc.replace(/\D/g, '')
}

function normalizarPlaca(placa) {
  return placa.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
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

const CPF_REGEX = /(\d{3}\.\d{3}\.\d{3}-\d{2})\s*$/
const CNPJ_REGEX = /(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})\s*$/
const SEM_DOCUMENTO_REGEX = /Sem\s+Documento\s*$/i

function parseCliente(campoBruto) {
  const campo = campoBruto.trim()

  const cnpjMatch = campo.match(CNPJ_REGEX)
  if (cnpjMatch) {
    return {
      nome: campo.slice(0, cnpjMatch.index).replace(/\s+/g, ' ').trim(),
      cpfCnpj: cnpjMatch[1],
    }
  }

  const cpfMatch = campo.match(CPF_REGEX)
  if (cpfMatch) {
    return {
      nome: campo.slice(0, cpfMatch.index).replace(/\s+/g, ' ').trim(),
      cpfCnpj: cpfMatch[1],
    }
  }

  const semDocMatch = campo.match(SEM_DOCUMENTO_REGEX)
  if (semDocMatch) {
    return {
      nome: campo.slice(0, semDocMatch.index).replace(/\s+/g, ' ').trim(),
      cpfCnpj: null,
    }
  }

  return { nome: campo.replace(/\s+/g, ' ').trim(), cpfCnpj: null }
}

const KM_REGEX = /([\d.]+)\s*KM\s*(?:Anterior|Atual)/gi
const PLACA_REGEX = /\b([A-Z]{3})-?(\d[A-Z0-9]\d{2})\b/

function parseVeiculo(campoBruto) {
  const campo = campoBruto.trim()

  let ultimoKm = null
  let primeiroKmIndex = campo.length
  let match
  KM_REGEX.lastIndex = 0
  while ((match = KM_REGEX.exec(campo)) !== null) {
    if (match.index < primeiroKmIndex) primeiroKmIndex = match.index
    ultimoKm = Number(match[1].replace(/\./g, ''))
  }

  const antesDoKm = campo.slice(0, primeiroKmIndex)
  const placaMatch = antesDoKm.match(PLACA_REGEX)

  if (!placaMatch) {
    return { placa: null, descricao: antesDoKm.replace(/\s+/g, ' ').trim(), cor: null, kmAtual: ultimoKm }
  }

  const descricao = antesDoKm
    .slice(0, placaMatch.index)
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^null\s+/i, '')
  const cor = antesDoKm.slice(placaMatch.index + placaMatch[0].length).replace(/\s+/g, ' ').trim() || null

  return {
    placa: `${placaMatch[1]}${placaMatch[2]}`.toUpperCase(),
    descricao: descricao || 'Não informado',
    cor,
    kmAtual: ultimoKm,
  }
}

function chunk(array, tamanho) {
  const chunks = []
  for (let i = 0; i < array.length; i += tamanho) {
    chunks.push(array.slice(i, i + tamanho))
  }
  return chunks
}

async function main() {
  console.log(`Modo: ${commit ? 'COMMIT (vai gravar no banco)' : 'DRY-RUN (nenhuma gravação será feita)'}`)
  console.log(`Lendo arquivo: ${caminhoArquivo}`)

  const conteudo = readFileSync(caminhoArquivo, 'utf8')
  const linhas = conteudo.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0)
  const [, ...dataLinhas] = linhas

  console.log(`Linhas de dados encontradas: ${dataLinhas.length}`)

  const erros = []
  const clientesPorChave = new Map()
  const linhasProcessadas = []

  dataLinhas.forEach((linhaBruta, index) => {
    const numeroLinha = index + 2
    const campos = dividirLinhaCsv(linhaBruta)

    if (campos.length < 3) {
      erros.push({ linha: numeroLinha, motivo: 'Linha com menos colunas do que o esperado' })
      return
    }

    const [idAntigo, clienteRaw, veiculoRaw] = campos
    const cliente = parseCliente(clienteRaw)
    const veiculo = parseVeiculo(veiculoRaw)

    const chaveCliente = cliente.cpfCnpj
      ? `doc:${normalizarDocumento(cliente.cpfCnpj)}`
      : `nome:${normalizarNome(cliente.nome)}`

    if (!clientesPorChave.has(chaveCliente)) {
      clientesPorChave.set(chaveCliente, cliente)
    }

    if (!veiculo.placa) {
      erros.push({ linha: numeroLinha, motivo: `Placa não encontrada (ID antigo ${idAntigo})` })
      return
    }

    linhasProcessadas.push({ linha: numeroLinha, idAntigo, cliente, chaveCliente, veiculo })
  })

  console.log(`Clientes únicos identificados no arquivo: ${clientesPorChave.size}`)
  console.log(`Veículos com placa reconhecida: ${linhasProcessadas.length}`)
  console.log(`Linhas com problema (sem placa reconhecida): ${erros.length}`)

  const { data: clientesExistentes, error: erroClientes } = await supabase
    .from('clientes')
    .select('id, nome, cpf_cnpj')
    .eq('oficina_id', OFICINA_ID)

  if (erroClientes) throw new Error(`Erro ao ler clientes existentes: ${erroClientes.message}`)

  const clienteIdPorDocumento = new Map()
  const clienteIdPorNome = new Map()

  for (const c of clientesExistentes ?? []) {
    if (c.cpf_cnpj) clienteIdPorDocumento.set(normalizarDocumento(c.cpf_cnpj), c.id)
    clienteIdPorNome.set(normalizarNome(c.nome), c.id)
  }

  function resolverClienteExistente(cliente) {
    if (cliente.cpfCnpj) {
      const id = clienteIdPorDocumento.get(normalizarDocumento(cliente.cpfCnpj))
      if (id) return id
    }
    return clienteIdPorNome.get(normalizarNome(cliente.nome)) ?? null
  }

  const clientesNovos = []
  for (const cliente of clientesPorChave.values()) {
    if (!resolverClienteExistente(cliente)) {
      clientesNovos.push(cliente)
    }
  }

  console.log(`Clientes já existentes no banco: ${clientesPorChave.size - clientesNovos.length}`)
  console.log(`Clientes novos a serem criados: ${clientesNovos.length}`)

  if (commit && clientesNovos.length > 0) {
    for (const lote of chunk(clientesNovos, 500)) {
      const { data, error } = await supabase
        .from('clientes')
        .insert(
          lote.map((c) => ({
            oficina_id: OFICINA_ID,
            nome: c.nome,
            cpf_cnpj: c.cpfCnpj,
          })),
        )
        .select('id, nome, cpf_cnpj')

      if (error) {
        console.error(`Erro ao criar lote de clientes: ${error.message}`)
        continue
      }

      for (const c of data ?? []) {
        if (c.cpf_cnpj) clienteIdPorDocumento.set(normalizarDocumento(c.cpf_cnpj), c.id)
        clienteIdPorNome.set(normalizarNome(c.nome), c.id)
      }
    }
  }

  const { data: veiculosExistentes, error: erroVeiculos } = await supabase
    .from('veiculos')
    .select('placa')
    .eq('oficina_id', OFICINA_ID)

  if (erroVeiculos) throw new Error(`Erro ao ler veículos existentes: ${erroVeiculos.message}`)

  const placasExistentes = new Set((veiculosExistentes ?? []).map((v) => normalizarPlaca(v.placa)))
  const placasNesteLote = new Set()

  const veiculosParaInserir = []

  for (const item of linhasProcessadas) {
    const placaNormalizada = normalizarPlaca(item.veiculo.placa)

    if (placasExistentes.has(placaNormalizada)) {
      erros.push({ linha: item.linha, motivo: `Placa ${placaNormalizada} já existe no banco, ignorada` })
      continue
    }

    if (placasNesteLote.has(placaNormalizada)) {
      erros.push({ linha: item.linha, motivo: `Placa ${placaNormalizada} duplicada no arquivo, ignorada` })
      continue
    }

    const clienteId = commit
      ? resolverClienteExistente(item.cliente)
      : resolverClienteExistente(item.cliente) ?? 'PENDENTE'

    if (!clienteId) {
      erros.push({ linha: item.linha, motivo: `Cliente não resolvido para a placa ${placaNormalizada}` })
      continue
    }

    placasNesteLote.add(placaNormalizada)
    veiculosParaInserir.push({
      linha: item.linha,
      oficina_id: OFICINA_ID,
      cliente_id: clienteId,
      placa: placaNormalizada,
      modelo: item.veiculo.descricao,
      cor: item.veiculo.cor,
      km_atual: item.veiculo.kmAtual,
      observacoes: `Importado do sistema antigo (ID ${item.idAntigo})`,
    })
  }

  console.log(`Veículos a serem importados: ${veiculosParaInserir.length}`)

  if (commit && veiculosParaInserir.length > 0) {
    for (const lote of chunk(veiculosParaInserir, 200)) {
      const { error } = await supabase.from('veiculos').insert(
        lote.map(({ linha: _linha, ...resto }) => resto),
      )

      if (!error) continue

      for (const linhaVeiculo of lote) {
        const { linha: _linha, ...resto } = linhaVeiculo
        const { error: erroIndividual } = await supabase.from('veiculos').insert(resto)
        if (erroIndividual) {
          erros.push({ linha: linhaVeiculo.linha, motivo: `Erro ao inserir placa ${resto.placa}: ${erroIndividual.message}` })
        }
      }
    }
  }

  const relatorio = [
    `Modo: ${commit ? 'COMMIT' : 'DRY-RUN'}`,
    `Linhas de dados no arquivo: ${dataLinhas.length}`,
    `Clientes únicos no arquivo: ${clientesPorChave.size}`,
    `Clientes novos ${commit ? 'criados' : 'a criar'}: ${clientesNovos.length}`,
    `Veículos ${commit ? 'importados' : 'a importar'}: ${veiculosParaInserir.length}`,
    `Linhas com problema: ${erros.length}`,
    '',
    'Detalhe dos problemas:',
    ...erros.map((e) => `  Linha ${e.linha}: ${e.motivo}`),
  ].join('\n')

  writeFileSync('relatorio-import-legado.txt', relatorio, 'utf8')
  console.log('\nRelatório completo salvo em relatorio-import-legado.txt')

  if (!commit) {
    console.log('\nNenhuma alteração foi gravada (dry-run). Rode novamente com --commit para gravar de verdade.')
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
