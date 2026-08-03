import { readFileSync, writeFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (use .env.migracao)')
  process.exit(1)
}

const commit = process.argv.includes('--commit')
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// A antiga importação de clientes.csv jogou o campo bruto "Cliente" do sistema legado
// direto no nome, sem separar Fantasia/Razão Social. Formato original do arquivo:
//   PF: "F" + espaços de preenchimento + Nome
//   PJ: "F" + Fantasia (pode ser vazia) + espaços de preenchimento + "R" + Razão Social
// Quando a Fantasia é vazia, o formato de PJ fica visualmente idêntico ao de PF
// ("F" + só espaço + texto) — não dá pra distinguir só pela forma da string. Por isso
// cruzamos com o clientes.csv original pelo texto bruto do campo "Cliente", que traz a
// coluna "Tipo" (PF/PJ) como fonte confiável.
const PJ_REGEX = /^F(.*?)\s{5,}R(.*)$/

function limparEspacos(texto) {
  return texto.replace(/\s+/g, ' ').trim()
}

// Alguns registros do sistema legado já vinham com o nome duplicado e colado sem
// espaço, ex.: "Kaue SoaresKaue Soares" (bug do sistema de origem, não da importação).
// Só colapsa quando as duas metades são idênticas — não arrisca cortar nomes legítimos.
function colapsarDuplicidade(texto) {
  if (texto.length % 2 !== 0) return texto
  const metade = texto.length / 2
  const primeira = texto.slice(0, metade)
  const segunda = texto.slice(metade)
  return primeira === segunda ? primeira : texto
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

function carregarTipoPorNomeRaw(caminhoCsv) {
  const conteudo = readFileSync(caminhoCsv, 'utf8')
  const linhas = conteudo.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0)
  const [, ...dados] = linhas
  const mapa = new Map()
  for (const linha of dados) {
    const campos = dividirLinhaCsv(linha)
    const [, tipo, nomeRaw] = campos
    if (nomeRaw) mapa.set(nomeRaw, tipo)
  }
  return mapa
}

const DIACRITICOS_REGEX = new RegExp('[\\u0300-\\u036f]', 'g')

function normalizarNome(nome) {
  return nome
    .normalize('NFD')
    .replace(DIACRITICOS_REGEX, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function classificarNomeCorrompido(nomeBruto, tipoPorNomeRaw) {
  if (!nomeBruto.startsWith('F')) return null

  const tipoConhecido = tipoPorNomeRaw.get(nomeBruto)

  if (tipoConhecido === 'PJ') {
    const pj = nomeBruto.match(PJ_REGEX)
    if (pj) return { tipo: 'PJ', fantasia: limparEspacos(pj[1]), nomeLimpo: limparEspacos(pj[2]), origem: 'csv' }
    // PJ confirmado pelo CSV mas sem o marcador "R" nesse texto — melhor esforço: só tira o "F".
    return { tipo: 'PJ', fantasia: null, nomeLimpo: limparEspacos(nomeBruto.slice(1)), origem: 'csv-sem-marcador' }
  }

  if (tipoConhecido === 'PF') {
    const nomeLimpo = limparEspacos(nomeBruto.slice(1))
    if (!nomeLimpo) return null
    return { tipo: 'PF', fantasia: null, nomeLimpo, origem: 'csv' }
  }

  // Não achou o texto exato no clientes.csv — melhor esforço via forma da string.
  const restante = nomeBruto.slice(1)
  if (/^\s/.test(restante) && !PJ_REGEX.test(nomeBruto)) {
    const nomeLimpo = limparEspacos(restante)
    if (!nomeLimpo) return null
    return { tipo: 'PF', fantasia: null, nomeLimpo, origem: 'heuristica' }
  }
  const pj = nomeBruto.match(PJ_REGEX)
  if (pj) {
    return { tipo: 'PJ', fantasia: limparEspacos(pj[1]), nomeLimpo: limparEspacos(pj[2]), origem: 'heuristica' }
  }
  return null
}

const UFS_VALIDAS = new Set([
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
])

function separarEndereco(enderecoBruto) {
  if (!enderecoBruto) return { endereco: enderecoBruto, cidade: null, estado: null, cep: null }
  const partes = enderecoBruto.split(',').map((p) => p.trim()).filter((p) => p.length > 0)

  let cep = null
  let estado = null
  let cidade = null

  if (partes.length > 0 && /^\d{8}$/.test(partes[partes.length - 1].replace(/\D/g, ''))) {
    cep = partes.pop().replace(/\D/g, '')
  }
  // O sistema legado usa case inconsistente para a UF (ex.: "Sp", "Mg", "SP") — o
  // teste precisa ser case-insensitive, e a lista de UFs válidas evita falso positivo
  // de alguma abreviação de dois caracteres que apareça por acaso no endereço.
  if (partes.length > 0 && UFS_VALIDAS.has(partes[partes.length - 1].toUpperCase())) {
    estado = partes.pop().toUpperCase()
  }
  if (partes.length > 0) {
    cidade = partes.pop()
  }

  return { endereco: partes.join(', ') || null, cidade, estado, cep }
}

async function buscarTodosClientes() {
  const registros = []
  let from = 0
  const tamanhoLote = 1000
  while (true) {
    const { data, error } = await supabase
      .from('clientes')
      .select('id,nome,cpf_cnpj,telefone,email,cep,endereco,numero,bairro,cidade,estado,observacoes')
      .range(from, from + tamanhoLote - 1)
    if (error) throw new Error(error.message)
    registros.push(...data)
    if (data.length < tamanhoLote) break
    from += tamanhoLote
  }
  return registros
}

async function main() {
  console.log(`Modo: ${commit ? 'COMMIT' : 'DRY-RUN'}`)

  const tipoPorNomeRaw = carregarTipoPorNomeRaw(new URL('../clientes.csv', import.meta.url))
  console.log('Registros lidos de clientes.csv:', tipoPorNomeRaw.size)

  const clientes = await buscarTodosClientes()
  console.log('Total de clientes no banco:', clientes.length)

  const corrompidos = []
  const limpos = []
  let viaHeuristica = 0
  for (const cliente of clientes) {
    const classificacao = classificarNomeCorrompido(cliente.nome, tipoPorNomeRaw)
    if (classificacao) {
      if (classificacao.origem !== 'csv') viaHeuristica++
      classificacao.nomeLimpo = colapsarDuplicidade(classificacao.nomeLimpo)
      if (classificacao.fantasia) classificacao.fantasia = colapsarDuplicidade(classificacao.fantasia)
      corrompidos.push({ cliente, ...classificacao })
    } else {
      limpos.push(cliente)
    }
  }
  console.log('Registros corrompidos (legado clientes.csv):', corrompidos.length)
  console.log('  - classificados sem achar o texto exato no CSV (heurística, revisar):', viaHeuristica)
  console.log('Registros já íntegros:', limpos.length)

  const mapaLimpos = new Map()
  const nomesAmbiguos = new Set()
  for (const cliente of limpos) {
    const chave = normalizarNome(cliente.nome)
    if (mapaLimpos.has(chave)) {
      nomesAmbiguos.add(chave)
    } else {
      mapaLimpos.set(chave, cliente)
    }
  }

  const alvosJaMesclados = new Set()
  const paraMesclar = []
  const paraCorrigirEmLugar = []
  const ambiguos = []

  for (const item of corrompidos) {
    const { cliente, tipo, fantasia, nomeLimpo, origem } = item
    const { endereco, cidade, estado, cep } = separarEndereco(cliente.endereco)
    const chave = normalizarNome(nomeLimpo)

    const observacoesExtra =
      tipo === 'PJ' && fantasia && normalizarNome(fantasia) !== normalizarNome(nomeLimpo)
        ? `Nome fantasia: ${fantasia}`
        : null

    if (origem !== 'csv') {
      ambiguos.push({ cliente, nomeLimpo, motivo: `texto não encontrado no clientes.csv, classificado por heurística (${origem})` })
      continue
    }

    if (nomesAmbiguos.has(chave)) {
      ambiguos.push({ cliente, nomeLimpo, motivo: 'nome ambíguo entre múltiplos clientes já íntegros' })
      continue
    }

    const alvo = mapaLimpos.get(chave)
    if (alvo && !alvosJaMesclados.has(alvo.id)) {
      alvosJaMesclados.add(alvo.id)
      paraMesclar.push({
        origemId: cliente.id,
        destinoId: alvo.id,
        destinoNome: alvo.nome,
        atualizacoes: {
          telefone: alvo.telefone ?? cliente.telefone ?? null,
          email: alvo.email ?? cliente.email ?? null,
          endereco: alvo.endereco ?? endereco,
          cidade: alvo.cidade ?? cidade,
          estado: alvo.estado ?? estado,
          cep: alvo.cep ?? cep,
          observacoes: alvo.observacoes ?? observacoesExtra ?? null,
        },
      })
    } else if (alvo && alvosJaMesclados.has(alvo.id)) {
      ambiguos.push({ cliente, nomeLimpo, motivo: `mais de um registro corrompido bate com o cliente já íntegro "${alvo.nome}"` })
    } else {
      paraCorrigirEmLugar.push({
        id: cliente.id,
        nomeAntigo: cliente.nome,
        atualizacoes: {
          nome: nomeLimpo,
          endereco,
          cidade,
          estado,
          cep,
          observacoes: cliente.observacoes ?? observacoesExtra ?? null,
        },
      })
    }
  }

  console.log('Serão mesclados em clientes já íntegros (e removidos como duplicata):', paraMesclar.length)
  console.log('Serão corrigidos no próprio registro (nome/endereço):', paraCorrigirEmLugar.length)
  console.log('Ambíguos (não tocados, revisar manualmente):', ambiguos.length)

  if (commit) {
    console.log('\nAplicando correções no próprio registro...')
    for (const item of paraCorrigirEmLugar) {
      const { error } = await supabase.from('clientes').update(item.atualizacoes).eq('id', item.id)
      if (error) console.error('Erro ao corrigir', item.id, error.message)
    }

    console.log('Aplicando mesclagens (enriquecendo cliente íntegro e removendo duplicata)...')
    for (const item of paraMesclar) {
      const { error: erroUpdate } = await supabase
        .from('clientes')
        .update(item.atualizacoes)
        .eq('id', item.destinoId)
      if (erroUpdate) {
        console.error('Erro ao enriquecer', item.destinoId, erroUpdate.message)
        continue
      }
      const { error: erroDelete } = await supabase.from('clientes').delete().eq('id', item.origemId)
      if (erroDelete) console.error('Erro ao remover duplicata', item.origemId, erroDelete.message)
    }
  }

  const relatorio = [
    `Modo: ${commit ? 'COMMIT' : 'DRY-RUN'}`,
    `Total de clientes no banco: ${clientes.length}`,
    `Registros corrompidos encontrados: ${corrompidos.length}`,
    `Corrigidos no próprio registro: ${paraCorrigirEmLugar.length}`,
    `Mesclados em clientes já íntegros (duplicata removida): ${paraMesclar.length}`,
    `Ambíguos (não tocados): ${ambiguos.length}`,
    '',
    '--- Amostra: corrigidos no próprio registro ---',
    ...paraCorrigirEmLugar
      .slice(0, 15)
      .map((i) => `"${i.nomeAntigo}" -> "${i.atualizacoes.nome}" | endereco="${i.atualizacoes.endereco}" cidade="${i.atualizacoes.cidade}" estado="${i.atualizacoes.estado}" cep="${i.atualizacoes.cep}"`),
    '',
    '--- Amostra: mesclados em cliente já íntegro ---',
    ...paraMesclar
      .slice(0, 15)
      .map((i) => `duplicata ${i.origemId} -> cliente "${i.destinoNome}" (${i.destinoId})`),
    '',
    '--- Ambíguos (revisar manualmente) ---',
    ...ambiguos.map((a) => `"${a.cliente.nome}" -> "${a.nomeLimpo}" | ${a.motivo}`),
  ].join('\n')

  writeFileSync('relatorio-fix-clientes-legado.txt', relatorio, 'utf8')
  console.log('\nRelatório salvo em relatorio-fix-clientes-legado.txt')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
