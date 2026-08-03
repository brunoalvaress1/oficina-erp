import type { VeiculoCsvRow } from '../types/importacao'
import { normalizarPlaca } from './normalizarPlaca'

export function encontrarPlacasDuplicadasNoArquivo(linhas: VeiculoCsvRow[]): Set<string> {
  const contagem = new Map<string, number>()

  linhas.forEach((linha) => {
    if (!linha.placa) return
    const placa = normalizarPlaca(linha.placa)
    contagem.set(placa, (contagem.get(placa) ?? 0) + 1)
  })

  const duplicadas = new Set<string>()
  contagem.forEach((total, placa) => {
    if (total > 1) duplicadas.add(placa)
  })

  return duplicadas
}
