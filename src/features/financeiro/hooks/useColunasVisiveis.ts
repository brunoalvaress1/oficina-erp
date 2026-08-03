import { useEffect, useState } from 'react'
import { usePermissions } from '@/hooks/usePermissions'

// Preferência de colunas visíveis por usuário, salva em localStorage (mesmo padrão
// já usado pra tema/sidebar) — não sincroniza entre dispositivos.
export function useColunasVisiveis(tabelaChave: string, colunasPadrao: string[]) {
  const { funcionario } = usePermissions()
  const chaveStorage = `financeiro:colunas:${tabelaChave}:${funcionario?.id ?? 'anonimo'}`

  const [visiveis, setVisiveis] = useState<Record<string, boolean>>(() => {
    const salvo = localStorage.getItem(chaveStorage)
    if (salvo) {
      try {
        return JSON.parse(salvo)
      } catch {
        // ignora JSON corrompido e cai no padrão
      }
    }
    return Object.fromEntries(colunasPadrao.map((chave) => [chave, true]))
  })

  useEffect(() => {
    localStorage.setItem(chaveStorage, JSON.stringify(visiveis))
  }, [visiveis, chaveStorage])

  function alternar(chave: string) {
    setVisiveis((atual) => ({ ...atual, [chave]: !atual[chave] }))
  }

  return { visiveis, alternar }
}
