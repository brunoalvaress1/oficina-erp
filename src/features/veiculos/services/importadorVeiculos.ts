import { supabase } from '@/lib/supabase'
import { parseCsvVeiculos } from './csvParser'
import { criarVeiculo } from './veiculoService'
import { veiculoCsvRowSchema } from '../schemas/importacaoSchema'
import { normalizarPlaca } from '../utils/normalizarPlaca'
import { normalizarNome, normalizarDocumento } from '../utils/normalizarNome'
import { encontrarPlacasDuplicadasNoArquivo } from '../utils/detectarDuplicidade'
import type { LinhaImportacaoPreview, ResultadoImportacao, VeiculoCsvRow } from '../types/importacao'

interface ClienteParaMatch {
  id: string
  nome: string
}

async function carregarClientesParaMatch() {
  const { data, error } = await supabase.from('clientes').select('id, nome, cpf_cnpj')
  if (error) throw new Error(error.message)

  const porDocumento = new Map<string, ClienteParaMatch>()
  const porNome = new Map<string, ClienteParaMatch[]>()

  for (const cliente of data ?? []) {
    if (cliente.cpf_cnpj) {
      porDocumento.set(normalizarDocumento(cliente.cpf_cnpj), { id: cliente.id, nome: cliente.nome })
    }

    const chaveNome = normalizarNome(cliente.nome)
    const lista = porNome.get(chaveNome) ?? []
    lista.push({ id: cliente.id, nome: cliente.nome })
    porNome.set(chaveNome, lista)
  }

  return { porDocumento, porNome }
}

async function carregarPlacasExistentes(): Promise<Set<string>> {
  const { data, error } = await supabase.from('veiculos').select('placa')
  if (error) throw new Error(error.message)
  return new Set((data ?? []).map((row) => normalizarPlaca(row.placa)))
}

function resolverCliente(
  linhaCsv: VeiculoCsvRow,
  indices: { porDocumento: Map<string, ClienteParaMatch>; porNome: Map<string, ClienteParaMatch[]> },
): { clienteId?: string; clienteNomeResolvido?: string; erro?: string } {
  if (linhaCsv.clienteCpfCnpj) {
    const encontrado = indices.porDocumento.get(normalizarDocumento(linhaCsv.clienteCpfCnpj))
    if (!encontrado) {
      return { erro: 'Cliente não encontrado pelo CPF/CNPJ informado' }
    }
    return { clienteId: encontrado.id, clienteNomeResolvido: encontrado.nome }
  }

  if (linhaCsv.clienteNome) {
    const candidatos = indices.porNome.get(normalizarNome(linhaCsv.clienteNome)) ?? []
    if (candidatos.length === 0) {
      return { erro: 'Cliente não encontrado pelo nome informado' }
    }
    if (candidatos.length > 1) {
      return { erro: 'Mais de um cliente encontrado com esse nome; informe o CPF/CNPJ' }
    }
    return { clienteId: candidatos[0].id, clienteNomeResolvido: candidatos[0].nome }
  }

  return { erro: 'Informe o CPF/CNPJ ou o nome do cliente' }
}

export async function gerarPreviewImportacao(conteudoCsv: string): Promise<LinhaImportacaoPreview[]> {
  const { linhas, colunasReconhecidas } = parseCsvVeiculos(conteudoCsv)

  if (colunasReconhecidas === 0) {
    throw new Error('Não foi possível reconhecer as colunas do arquivo. Verifique o cabeçalho do CSV.')
  }

  const [placasExistentes, indicesClientes] = await Promise.all([
    carregarPlacasExistentes(),
    carregarClientesParaMatch(),
  ])

  const placasDuplicadasNoArquivo = encontrarPlacasDuplicadasNoArquivo(linhas)
  const placasJaVistas = new Set<string>()

  return linhas.map((linhaCsv) => {
    const validacao = veiculoCsvRowSchema.safeParse(linhaCsv)

    if (!validacao.success) {
      return {
        linha: linhaCsv.linha,
        dados: linhaCsv,
        status: 'erro',
        erros: validacao.error.issues.map((issue) => issue.message),
      }
    }

    const erros: string[] = []
    const { clienteId, clienteNomeResolvido, erro: erroCliente } = resolverCliente(linhaCsv, indicesClientes)
    if (erroCliente) erros.push(erroCliente)

    const placaNormalizada = normalizarPlaca(validacao.data.placa)
    const jaExisteNoBanco = placasExistentes.has(placaNormalizada)
    const repetidaNoArquivo = placasDuplicadasNoArquivo.has(placaNormalizada) && placasJaVistas.has(placaNormalizada)
    placasJaVistas.add(placaNormalizada)

    if (jaExisteNoBanco) erros.push('Já existe um veículo cadastrado com essa placa')
    if (repetidaNoArquivo) erros.push('Placa duplicada dentro do próprio arquivo')

    if (erros.length > 0) {
      return {
        linha: linhaCsv.linha,
        dados: linhaCsv,
        status: jaExisteNoBanco || repetidaNoArquivo ? 'duplicado' : 'erro',
        erros,
        clienteId,
        clienteNomeResolvido,
      }
    }

    return {
      linha: linhaCsv.linha,
      dados: linhaCsv,
      status: 'valido',
      erros: [],
      clienteId,
      clienteNomeResolvido,
    }
  })
}

export async function confirmarImportacao(
  linhas: LinhaImportacaoPreview[],
  oficinaId: string,
): Promise<ResultadoImportacao> {
  const validas = linhas.filter((linha) => linha.status === 'valido' && linha.clienteId)

  let importados = 0
  const erros: { linha: number; mensagem: string }[] = []

  for (const linha of validas) {
    try {
      await criarVeiculo(
        {
          clienteId: linha.clienteId!,
          placa: normalizarPlaca(linha.dados.placa!),
          marca: linha.dados.marca,
          modelo: linha.dados.modelo!,
          cor: linha.dados.cor,
          ano: linha.dados.ano,
          anoModelo: linha.dados.anoModelo,
          chassi: linha.dados.chassi,
          kmAtual: linha.dados.kmAtual ? Number(linha.dados.kmAtual) : undefined,
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
