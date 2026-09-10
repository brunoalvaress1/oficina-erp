// Junta num ZIP único os XMLs de todas as notas fiscais que batem com o
// filtro atual da aba "Notas Emitidas" (mesmo período / modelo / status /
// busca da tela). A ideia é a oficina mandar pro contador, no WhatsApp, uma
// pasta com os XMLs do mês de uma vez — em vez de baixar nota por nota.
//
// O download de cada XML acontece AQUI no servidor (não no navegador): os
// arquivos ficam no servidor da Focus, que não manda header de CORS, então
// um fetch() direto do browser seria bloqueado.
import { corsHeaders } from '../_shared/cors.ts'
import { autenticarFuncionario, criarClienteAdmin } from '../_shared/auth.ts'

interface FiltroExport {
  modelo?: 'peca' | 'servico'
  status?: string
  dataInicio?: string
  dataFim?: string
  search?: string
}

// ---------- ZIP (método STORED, sem compressão) ----------
// XML de NF-e é pequeno (~8 KB) e o volume de um mês raramente passa de
// alguns MB — STORED é 100% compatível com qualquer descompactador e não
// depende de nenhuma lib externa.
const CRC_TABELA = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i++) c = CRC_TABELA[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

interface EntradaZip {
  nome: string
  dados: Uint8Array
}

function montarZip(entradas: EntradaZip[]): Uint8Array {
  const enc = new TextEncoder()
  const partesLocais: Uint8Array[] = []
  const partesCentrais: Uint8Array[] = []
  let offset = 0

  // data/hora fixa (formato DOS) — irrelevante pra esse uso, o que importa é
  // o conteúdo do XML (a data de emissão está dentro dele).
  const dosTime = 0
  const dosDate = ((2026 - 1980) << 9) | (1 << 5) | 1

  for (const { nome, dados } of entradas) {
    const nomeBytes = enc.encode(nome)
    const crc = crc32(dados)

    const local = new Uint8Array(30 + nomeBytes.length)
    const lv = new DataView(local.buffer)
    lv.setUint32(0, 0x04034b50, true)
    lv.setUint16(4, 20, true)
    lv.setUint16(6, 0, true)
    lv.setUint16(8, 0, true) // método 0 = stored
    lv.setUint16(10, dosTime, true)
    lv.setUint16(12, dosDate, true)
    lv.setUint32(14, crc, true)
    lv.setUint32(18, dados.length, true)
    lv.setUint32(22, dados.length, true)
    lv.setUint16(26, nomeBytes.length, true)
    lv.setUint16(28, 0, true)
    local.set(nomeBytes, 30)
    partesLocais.push(local, dados)

    const central = new Uint8Array(46 + nomeBytes.length)
    const cv = new DataView(central.buffer)
    cv.setUint32(0, 0x02014b50, true)
    cv.setUint16(4, 20, true)
    cv.setUint16(6, 20, true)
    cv.setUint16(8, 0, true)
    cv.setUint16(10, 0, true)
    cv.setUint16(12, dosTime, true)
    cv.setUint16(14, dosDate, true)
    cv.setUint32(16, crc, true)
    cv.setUint32(20, dados.length, true)
    cv.setUint32(24, dados.length, true)
    cv.setUint16(28, nomeBytes.length, true)
    cv.setUint16(30, 0, true)
    cv.setUint16(32, 0, true)
    cv.setUint16(34, 0, true)
    cv.setUint16(36, 0, true)
    cv.setUint32(38, 0, true)
    cv.setUint32(42, offset, true)
    central.set(nomeBytes, 46)
    partesCentrais.push(central)

    offset += local.length + dados.length
  }

  const inicioCentral = offset
  let tamanhoCentral = 0
  for (const p of partesCentrais) tamanhoCentral += p.length

  const fim = new Uint8Array(22)
  const fv = new DataView(fim.buffer)
  fv.setUint32(0, 0x06054b50, true)
  fv.setUint16(4, 0, true)
  fv.setUint16(6, 0, true)
  fv.setUint16(8, entradas.length, true)
  fv.setUint16(10, entradas.length, true)
  fv.setUint32(12, tamanhoCentral, true)
  fv.setUint32(16, inicioCentral, true)
  fv.setUint16(20, 0, true)

  const todas = [...partesLocais, ...partesCentrais, fim]
  let total = 0
  for (const p of todas) total += p.length
  const saida = new Uint8Array(total)
  let pos = 0
  for (const p of todas) {
    saida.set(p, pos)
    pos += p.length
  }
  return saida
}

function sanitizar(s: string): string {
  return s.replace(/[^\w.\- ]+/g, '_').replace(/\s+/g, ' ').trim().slice(0, 120) || 'nota'
}

function nomePasta(f: FiltroExport): string {
  const modelo = f.modelo === 'servico' ? 'nfse' : f.modelo === 'peca' ? 'nfe' : 'notas'
  const mesInicio = (f.dataInicio ?? '').slice(0, 7)
  const mesFim = (f.dataFim ?? '').slice(0, 7)
  if (mesInicio && mesInicio === mesFim) return `xmls-${modelo}-${mesInicio}`
  if (f.dataInicio || f.dataFim) return `xmls-${modelo}-${f.dataInicio ?? 'inicio'}_a_${f.dataFim ?? 'hoje'}`
  return `xmls-${modelo}-todas`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const admin = criarClienteAdmin()

  try {
    const funcionario = await autenticarFuncionario(req, admin, 'notas_fiscais.visualizar')
    const filtro: FiltroExport = await req.json().catch(() => ({}))

    // Mesma view e mesmos filtros da listagem da tela (listarNotasFiscais),
    // só que sem paginação e trazendo só o que precisa pra baixar/nomear.
    let q = admin
      .from('notas_fiscais_saida_lista')
      .select('url_xml, chave_acesso, numero, serie, tipo, cliente_nome, ordem_numero, created_at')
      .eq('oficina_id', funcionario.oficinaId)
      .not('url_xml', 'is', null)

    if (filtro.status) q = q.eq('status', filtro.status)
    if (filtro.modelo === 'peca') q = q.in('tipo', ['nfce', 'nfe'])
    if (filtro.modelo === 'servico') q = q.eq('tipo', 'nfse')
    if (filtro.dataInicio) q = q.gte('created_at', `${filtro.dataInicio}T00:00:00`)
    if (filtro.dataFim) q = q.lte('created_at', `${filtro.dataFim}T23:59:59`)

    const termo = filtro.search?.trim()
    if (termo) {
      const escapado = termo.replace(/,/g, ' ')
      const cond = [`cliente_nome.ilike.%${escapado}%`, `chave_acesso.ilike.%${escapado}%`, `referencia.ilike.%${escapado}%`]
      if (/^\d+$/.test(escapado)) cond.push(`ordem_numero.eq.${escapado}`)
      q = q.or(cond.join(','))
    }

    const { data: notas, error } = await q.order('created_at', { ascending: true }).limit(2000)
    if (error) throw new Error(error.message)
    if (!notas || notas.length === 0) throw new Error('SEM_XMLS: nenhuma nota com XML disponível nesse filtro.')

    // Baixa em blocos pra não abrir uma conexão pra cada nota de uma vez.
    const LOTE = 12
    const entradas: EntradaZip[] = []
    const falhas: string[] = []
    const usados = new Set<string>()

    for (let i = 0; i < notas.length; i += LOTE) {
      const bloco = notas.slice(i, i + LOTE)
      const baixados = await Promise.all(
        bloco.map(async (n: Record<string, unknown>) => {
          try {
            const urlXml = String(n.url_xml)
            const resp = await fetch(urlXml)
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
            const buf = new Uint8Array(await resp.arrayBuffer())
            // Nome do arquivo: chave de acesso (44 dígitos, o padrão que o
            // contador espera) quando existe; senão o nome que a própria
            // Focus deu ao XML; e por último tipo+número.
            const chave = n.chave_acesso ? String(n.chave_acesso).replace(/\D/g, '') : ''
            const nomeFocus = urlXml.split('/').pop()?.replace(/\.xml$/i, '') ?? ''
            const base =
              chave.length === 44 ? chave : nomeFocus || `${String(n.tipo).toUpperCase()}-${n.numero ?? 's-n'}-serie${n.serie ?? '0'}`
            let nome = `${sanitizar(base)}.xml`
            let k = 2
            while (usados.has(nome)) nome = `${sanitizar(base)}-${k++}.xml`
            usados.add(nome)
            return { nome, dados: buf } as EntradaZip
          } catch (e) {
            falhas.push(`${n.chave_acesso ?? n.numero ?? '?'}: ${e instanceof Error ? e.message : String(e)}`)
            return null
          }
        }),
      )
      for (const b of baixados) if (b) entradas.push(b)
    }

    if (entradas.length === 0) throw new Error('SEM_XMLS: não consegui baixar nenhum XML (todos falharam).')

    const pasta = nomePasta(filtro)
    const zip = montarZip(entradas.map((e) => ({ nome: `${pasta}/${e.nome}`, dados: e.dados })))

    return new Response(zip, {
      status: 200,
      headers: {
        ...corsHeaders,
        // octet-stream (não application/zip) porque é o content-type que o
        // supabase-js reconhece como binário e devolve como Blob no invoke.
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${pasta}.zip"`,
        'Access-Control-Expose-Headers': 'Content-Disposition, X-Total-Xmls, X-Total-Falhas',
        'X-Total-Xmls': String(entradas.length),
        'X-Total-Falhas': String(falhas.length),
      },
    })
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : String(error)
    return new Response(JSON.stringify({ error: mensagem }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
