import { writeFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (use .env.migracao)')
  process.exit(1)
}

const commit = process.argv.includes('--commit')
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const DIACRITICOS_REGEX = new RegExp('[\\u0300-\\u036f]', 'g')

function normalizarNomeCidade(texto) {
  return texto
    .normalize('NFD')
    .replace(DIACRITICOS_REGEX, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

async function executarComConcorrencia(itens, limite, tarefa) {
  const resultados = new Array(itens.length)
  let indice = 0
  async function worker() {
    while (indice < itens.length) {
      const atual = indice
      indice += 1
      resultados[atual] = await tarefa(itens[atual], atual)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limite, itens.length) }, worker))
  return resultados
}

async function buscarTodosClientes() {
  const registros = []
  let from = 0
  const tamanhoLote = 1000
  while (true) {
    const { data, error } = await supabase
      .from('clientes')
      .select('id, nome, cep, cidade, estado, codigo_cidade')
      .range(from, from + tamanhoLote - 1)
    if (error) throw new Error(error.message)
    registros.push(...data)
    if (data.length < tamanhoLote) break
    from += tamanhoLote
  }
  return registros
}

async function buscarIbgePorCep(cep) {
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
    const data = await response.json()
    if (data.erro || !data.ibge) return null
    return String(data.ibge)
  } catch {
    return null
  }
}

const cacheMunicipiosPorUf = new Map()

async function buscarMunicipiosPorUf(uf) {
  if (cacheMunicipiosPorUf.has(uf)) return cacheMunicipiosPorUf.get(uf)
  try {
    const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`)
    const data = await response.json()
    const mapa = new Map()
    for (const municipio of data) {
      mapa.set(normalizarNomeCidade(municipio.nome), String(municipio.id))
    }
    cacheMunicipiosPorUf.set(uf, mapa)
    return mapa
  } catch {
    cacheMunicipiosPorUf.set(uf, new Map())
    return new Map()
  }
}

async function main() {
  console.log(`Modo: ${commit ? 'COMMIT' : 'DRY-RUN'}`)

  const clientes = await buscarTodosClientes()
  console.log('Total de clientes no banco:', clientes.length)

  const pendentes = clientes.filter((c) => !c.codigo_cidade)
  console.log('Sem código da cidade ainda:', pendentes.length)

  const comCep = pendentes.filter((c) => c.cep && c.cep.replace(/\D/g, '').length === 8)
  const temCidadeEstado = (c) => c.cidade && c.estado && c.estado.trim().length === 2
  const semDadosSuficientes = pendentes.filter((c) => !(c.cep && c.cep.replace(/\D/g, '').length === 8) && !temCidadeEstado(c))

  console.log('Resolvíveis via CEP (1ª tentativa):', comCep.length)
  console.log('Com cidade+estado como fallback:', pendentes.filter(temCidadeEstado).length)
  console.log('Sem dados suficientes (CEP e cidade/estado ausentes):', semDadosSuficientes.length)

  // --- Resolver via CEP (ViaCEP), com cache por CEP único ---
  const cepsUnicos = [...new Set(comCep.map((c) => c.cep.replace(/\D/g, '')))]
  console.log(`\nConsultando ViaCEP para ${cepsUnicos.length} CEPs únicos...`)

  const mapaCepParaIbge = new Map()
  const resultadosCep = await executarComConcorrencia(cepsUnicos, 10, async (cep) => {
    const ibge = await buscarIbgePorCep(cep)
    return { cep, ibge }
  })
  for (const { cep, ibge } of resultadosCep) {
    if (ibge) mapaCepParaIbge.set(cep, ibge)
  }
  console.log('CEPs resolvidos com sucesso:', [...mapaCepParaIbge.values()].length, '/', cepsUnicos.length)

  // --- Resolver via cidade+estado (API de localidades do IBGE) ---
  // Usado tanto para quem não tem CEP quanto como fallback de quem tem CEP mas o
  // CEP não foi encontrado no ViaCEP (CEP inválido/desatualizado na base deles).
  const ufsUnicas = [...new Set(pendentes.filter(temCidadeEstado).map((c) => c.estado.trim().toUpperCase()))]
  console.log(`\nConsultando municípios do IBGE para ${ufsUnicas.length} UF(s)...`)
  for (const uf of ufsUnicas) {
    await buscarMunicipiosPorUf(uf)
  }

  function resolverPorCidadeEstado(cliente) {
    const uf = cliente.estado.trim().toUpperCase()
    const mapaMunicipios = cacheMunicipiosPorUf.get(uf) ?? new Map()
    const chave = normalizarNomeCidade(cliente.cidade)
    return mapaMunicipios.get(chave) ?? null
  }

  // --- Monta plano de atualização ---
  const atualizacoes = []
  const naoResolvidos = []

  for (const cliente of pendentes) {
    if (cliente.cep && cliente.cep.replace(/\D/g, '').length === 8) {
      const cepLimpo = cliente.cep.replace(/\D/g, '')
      const ibgePorCep = mapaCepParaIbge.get(cepLimpo)
      if (ibgePorCep) {
        atualizacoes.push({ id: cliente.id, nome: cliente.nome, codigoCidade: ibgePorCep, origem: `cep:${cepLimpo}` })
        continue
      }
      if (temCidadeEstado(cliente)) {
        const ibgePorCidade = resolverPorCidadeEstado(cliente)
        if (ibgePorCidade) {
          atualizacoes.push({
            id: cliente.id,
            nome: cliente.nome,
            codigoCidade: ibgePorCidade,
            origem: `cidade (fallback, CEP ${cepLimpo} inválido):${cliente.cidade}/${cliente.estado.trim().toUpperCase()}`,
          })
          continue
        }
      }
      naoResolvidos.push({
        id: cliente.id,
        nome: cliente.nome,
        motivo: `CEP ${cepLimpo} não encontrado no ViaCEP${temCidadeEstado(cliente) ? ' e cidade/estado também não bateram com o IBGE' : ' e não há cidade/estado cadastrados'}`,
      })
      continue
    }

    if (temCidadeEstado(cliente)) {
      const ibge = resolverPorCidadeEstado(cliente)
      if (ibge) {
        atualizacoes.push({
          id: cliente.id,
          nome: cliente.nome,
          codigoCidade: ibge,
          origem: `cidade:${cliente.cidade}/${cliente.estado.trim().toUpperCase()}`,
        })
      } else {
        naoResolvidos.push({
          id: cliente.id,
          nome: cliente.nome,
          motivo: `Cidade "${cliente.cidade}/${cliente.estado.trim().toUpperCase()}" não encontrada na lista de municípios do IBGE`,
        })
      }
      continue
    }

    naoResolvidos.push({ id: cliente.id, nome: cliente.nome, motivo: 'Sem CEP e sem cidade/estado cadastrados' })
  }

  console.log('\nSerão atualizados:', atualizacoes.length)
  console.log('Não resolvidos (precisam de preenchimento manual):', naoResolvidos.length)

  let atualizados = 0
  const erros = []

  if (commit) {
    console.log('\nAplicando atualizações...')
    const resultados = await executarComConcorrencia(atualizacoes, 20, async (item) => {
      const { error } = await supabase.from('clientes').update({ codigo_cidade: item.codigoCidade }).eq('id', item.id)
      if (error) return { erro: error.message, item }
      return { ok: true }
    })
    for (const resultado of resultados) {
      if (resultado.ok) atualizados += 1
      else erros.push({ id: resultado.item.id, nome: resultado.item.nome, mensagem: resultado.erro })
    }
  }

  const relatorio = [
    `Modo: ${commit ? 'COMMIT' : 'DRY-RUN'}`,
    `Total de clientes no banco: ${clientes.length}`,
    `Já tinham código da cidade: ${clientes.length - pendentes.length}`,
    `Pendentes: ${pendentes.length}`,
    `Com CEP válido (1ª tentativa): ${comCep.length}`,
    `Com cidade+estado como fallback: ${pendentes.filter(temCidadeEstado).length}`,
    `Sem dados suficientes: ${semDadosSuficientes.length}`,
    `CEPs únicos consultados: ${cepsUnicos.length}`,
    `CEPs resolvidos: ${[...mapaCepParaIbge.values()].length}`,
    `Planejados para atualizar: ${atualizacoes.length}`,
    `Atualizados de fato: ${atualizados}`,
    `Erros ao atualizar: ${erros.length}`,
    `Não resolvidos: ${naoResolvidos.length}`,
    '',
    '--- Amostra: atualizados (30) ---',
    ...atualizacoes.slice(0, 30).map((a) => `${a.nome} -> ${a.codigoCidade} (${a.origem})`),
    '',
    '--- Não resolvidos (todos, revisar manualmente) ---',
    ...naoResolvidos.map((n) => `${n.nome} (${n.id}): ${n.motivo}`),
    '',
    '--- Erros ao atualizar ---',
    ...erros.map((e) => `${e.nome} (${e.id}): ${e.mensagem}`),
  ].join('\n')

  writeFileSync('relatorio-backfill-clientes-codigo-cidade.txt', relatorio, 'utf8')
  console.log('\nRelatório salvo em relatorio-backfill-clientes-codigo-cidade.txt')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
