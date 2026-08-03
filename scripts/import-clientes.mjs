import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const OFICINA_ID_PADRAO = '1ccd4def-f9ad-4bd1-876a-ebcbe7857141'
const CSV_DEFAULT_PATH = path.resolve(__dirname, '../clientes.csv')
const BATCH_SIZE = 500

function parseArgs(argv) {
  const args = {
    file: CSV_DEFAULT_PATH,
    oficinaId: OFICINA_ID_PADRAO,
  }

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i]
    if (token === '--file' && argv[i + 1]) {
      args.file = path.resolve(process.cwd(), argv[i + 1])
      i += 1
      continue
    }
    if (token === '--oficina-id' && argv[i + 1]) {
      args.oficinaId = argv[i + 1]
      i += 1
      continue
    }
  }

  return args
}

function normalizeText(value) {
  if (value == null) return null
  const cleaned = String(value).trim()
  if (!cleaned || cleaned === '---') return null
  return cleaned
}

function normalizeEmail(value) {
  const email = normalizeText(value)
  if (!email) return null
  return email.toLowerCase()
}

function normalizeTelefone(value) {
  const tel = normalizeText(value)
  if (!tel) return null
  const digits = tel.replace(/\D/g, '')
  return digits || null
}

function splitCsvLine(line) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    const next = line[i + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
      continue
    }

    current += char
  }

  result.push(current)
  return result.map((part) => part.trim())
}

function parseCsv(content) {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) {
    throw new Error('CSV sem dados. É necessário cabeçalho + pelo menos 1 linha.')
  }

  const headers = splitCsvLine(lines[0]).map((h) => h.trim())
  const rows = []

  for (let i = 1; i < lines.length; i += 1) {
    const values = splitCsvLine(lines[i])
    const row = {}
    for (let c = 0; c < headers.length; c += 1) {
      row[headers[c]] = values[c] ?? ''
    }
    rows.push(row)
  }

  return rows
}

function mapCsvRowToCliente(row, oficinaId) {
  const nome = normalizeText(row.Cliente ?? row.Nome ?? row.nome)
  if (!nome) return null

  const enderecoCompleto = normalizeText(row['Endereço'] ?? row.Endereco ?? row.endereco)

  return {
    oficina_id: oficinaId,
    nome,
    cpf_cnpj: normalizeText(row.CPF ?? row.CNPJ ?? row['CPF/CNPJ'] ?? row.cpf_cnpj),
    telefone: normalizeTelefone(row.Telefone ?? row.telefone),
    email: normalizeEmail(row['E-mail'] ?? row.Email ?? row.email),
    cep: normalizeText(row.CEP ?? row.cep),
    endereco: enderecoCompleto,
    numero: normalizeText(row.Numero ?? row.Número ?? row.numero),
    bairro: normalizeText(row.Bairro ?? row.bairro),
    cidade: normalizeText(row.Cidade ?? row.cidade),
    estado: normalizeText(row.Estado ?? row.estado),
    observacoes: normalizeText(row.Observacoes ?? row.Observações ?? row.observacoes),
  }
}

async function insertInBatches(supabase, payload) {
  let inserted = 0

  for (let i = 0; i < payload.length; i += BATCH_SIZE) {
    const batch = payload.slice(i, i + BATCH_SIZE)
    const { error } = await supabase.from('clientes').insert(batch)

    if (error) {
      throw new Error(`Erro no lote ${i / BATCH_SIZE + 1}: ${error.message}`)
    }

    inserted += batch.length
    console.log(`Lote ${i / BATCH_SIZE + 1} importado: +${batch.length} (total: ${inserted})`)
  }

  return inserted
}

async function run() {
  const { file, oficinaId } = parseArgs(process.argv)

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY antes de executar.')
  }

  if (!fs.existsSync(file)) {
    throw new Error(`Arquivo CSV não encontrado: ${file}`)
  }

  console.log(`Lendo CSV: ${file}`)
  const rawCsv = fs.readFileSync(file, 'utf-8')
  const parsedRows = parseCsv(rawCsv)

  const invalidRows = []
  const payload = []

  parsedRows.forEach((row, index) => {
    const mapped = mapCsvRowToCliente(row, oficinaId)
    if (!mapped) {
      invalidRows.push({ linha: index + 2, motivo: 'Nome/Cliente ausente' })
      return
    }
    payload.push(mapped)
  })

  if (payload.length === 0) {
    throw new Error('Nenhuma linha válida para importar.')
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  })

  console.log(`Registros válidos: ${payload.length}`)
  if (invalidRows.length > 0) {
    console.log(`Registros ignorados: ${invalidRows.length}`)
    const logPath = path.resolve(process.cwd(), 'import-clientes-invalidos.json')
    fs.writeFileSync(logPath, JSON.stringify(invalidRows, null, 2), 'utf-8')
    console.log(`Log de inválidos salvo em: ${logPath}`)
  }

  const total = await insertInBatches(supabase, payload)
  console.log(`Importação finalizada. Total inserido: ${total}`)
}

run().catch((error) => {
  console.error('Falha na importação:', error.message)
  process.exit(1)
})
