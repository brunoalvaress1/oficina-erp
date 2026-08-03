import { supabase } from '@/lib/supabase'
import { parseMoedaBr } from '@/utils/format'
import { parseCsvProdutos } from './csvParser'
import { criarProduto } from './produtoService'
import { produtoCsvRowSchema } from '../schemas/importacaoProdutoSchema'
import type { LinhaImportacaoProdutoPreview, ProdutoCsvRow, ResultadoImportacaoProduto } from '../types/importacaoProduto'

function normalizarNome(nome: string): string {
  return nome.trim().toLowerCase().replace(/\s+/g, ' ')
}

// O sistema legado usa "N/A" como marcador de "não informado" em vez de deixar
// a célula vazia.
function limparCodigo(valor: string | undefined): string | undefined {
  if (!valor) return undefined
  return valor.trim().toUpperCase() === 'N/A' ? undefined : valor
}

async function carregarNomesExistentes(): Promise<Set<string>> {
  const { data, error } = await supabase.from('produtos').select('nome')
  if (error) throw new Error(error.message)
  return new Set((data ?? []).map((row) => normalizarNome(row.nome)))
}

function encontrarNomesDuplicadosNoArquivo(linhas: ProdutoCsvRow[]): Set<string> {
  const vistos = new Set<string>()
  const duplicados = new Set<string>()
  for (const linha of linhas) {
    if (!linha.nome) continue
    const chave = normalizarNome(linha.nome)
    if (vistos.has(chave)) duplicados.add(chave)
    vistos.add(chave)
  }
  return duplicados
}

export async function gerarPreviewImportacaoProdutos(conteudoCsv: string): Promise<LinhaImportacaoProdutoPreview[]> {
  const { linhas, colunasReconhecidas } = parseCsvProdutos(conteudoCsv)

  if (colunasReconhecidas === 0) {
    throw new Error('Não foi possível reconhecer as colunas do arquivo. Verifique o cabeçalho do CSV.')
  }

  const nomesExistentes = await carregarNomesExistentes()
  const nomesDuplicadosNoArquivo = encontrarNomesDuplicadosNoArquivo(linhas)
  const nomesJaVistos = new Set<string>()

  return linhas.map((linhaCsv) => {
    const validacao = produtoCsvRowSchema.safeParse(linhaCsv)

    if (!validacao.success) {
      return {
        linha: linhaCsv.linha,
        dados: linhaCsv,
        status: 'erro',
        erros: validacao.error.issues.map((issue) => issue.message),
      }
    }

    const chaveNome = normalizarNome(validacao.data.nome)
    const jaExisteNoBanco = nomesExistentes.has(chaveNome)
    const repetidaNoArquivo = nomesDuplicadosNoArquivo.has(chaveNome) && nomesJaVistos.has(chaveNome)
    nomesJaVistos.add(chaveNome)

    const erros: string[] = []
    if (jaExisteNoBanco) erros.push('Já existe um produto cadastrado com esse nome')
    if (repetidaNoArquivo) erros.push('Nome duplicado dentro do próprio arquivo')

    if (erros.length > 0) {
      return {
        linha: linhaCsv.linha,
        dados: linhaCsv,
        status: jaExisteNoBanco || repetidaNoArquivo ? 'duplicado' : 'erro',
        erros,
      }
    }

    return {
      linha: linhaCsv.linha,
      dados: linhaCsv,
      status: 'valido',
      erros: [],
    }
  })
}

export async function confirmarImportacaoProdutos(
  linhas: LinhaImportacaoProdutoPreview[],
  oficinaId: string,
): Promise<ResultadoImportacaoProduto> {
  const validas = linhas.filter((linha) => linha.status === 'valido')

  let importados = 0
  const erros: { linha: number; mensagem: string }[] = []

  for (const linha of validas) {
    try {
      await criarProduto(
        {
          nome: linha.dados.nome!,
          categoria: linha.dados.categoria,
          subcategoria: linha.dados.subcategoria,
          marca: linha.dados.marca,
          codigoFabricante: limparCodigo(linha.dados.codigoFabricante),
          codigoInterno: limparCodigo(linha.dados.codigoInterno),
          valorCusto: linha.dados.valorCusto ? parseMoedaBr(linha.dados.valorCusto) : undefined,
          valorOs: linha.dados.valorOs ? parseMoedaBr(linha.dados.valorOs) : undefined,
          estoqueFisico: linha.dados.estoqueFisico ? parseMoedaBr(linha.dados.estoqueFisico) : undefined,
          ncm: linha.dados.ncm,
          observacoes: linha.dados.observacoes,
        },
        oficinaId,
      )
      importados += 1
    } catch (error) {
      erros.push({
        linha: linha.linha,
        mensagem: error instanceof Error ? error.message : 'Erro desconhecido',
      })
    }
  }

  return {
    totalLinhas: linhas.length,
    importados,
    falhas: linhas.length - importados,
    erros,
  }
}
