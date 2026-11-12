import { useEffect, useState } from 'react'

function chaveStorage(pagina: string, funcionarioId: string): string {
  return `colunas-visiveis:${pagina}:${funcionarioId}`
}

function lerColunasSalvas<T extends Record<string, boolean>>(chave: string, padrao: T): T {
  try {
    const salvo = localStorage.getItem(chave)
    if (!salvo) return padrao
    const parseado = JSON.parse(salvo) as Record<string, unknown>
    const mesclado = { ...padrao }
    for (const coluna of Object.keys(padrao)) {
      if (typeof parseado[coluna] === 'boolean') mesclado[coluna as keyof T] = parseado[coluna] as T[keyof T]
    }
    return mesclado
  } catch {
    return padrao
  }
}

// Lembra quais colunas cada FUNCIONÁRIO escolheu esconder/mostrar numa
// tabela (Produtos, Clientes etc) — guardado no navegador numa chave que
// inclui o id do funcionário, então cada um tem sua própria preferência
// mesmo compartilhando o mesmo computador/navegador. `pagina` identifica a
// tabela (ex: "produtos") pra não misturar preferências de telas diferentes.
export function useColunasVisiveis<T extends Record<string, boolean>>(
  pagina: string,
  funcionarioId: string | undefined,
  padrao: T,
): [T, (coluna: keyof T) => void] {
  const [colunas, setColunas] = useState<T>(() => (funcionarioId ? lerColunasSalvas(chaveStorage(pagina, funcionarioId), padrao) : padrao))

  // funcionarioId normalmente só fica disponível depois do primeiro render
  // (vem de uma query assíncrona em usePermissions) — reaplica a leitura do
  // localStorage assim que ele chegar, pra não ficar preso no padrão.
  useEffect(() => {
    if (!funcionarioId) return
    setColunas(lerColunasSalvas(chaveStorage(pagina, funcionarioId), padrao))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina, funcionarioId])

  function alternar(coluna: keyof T) {
    setColunas((prev) => {
      const novo = { ...prev, [coluna]: !prev[coluna] }
      if (funcionarioId) {
        try {
          localStorage.setItem(chaveStorage(pagina, funcionarioId), JSON.stringify(novo))
        } catch {
          // localStorage indisponível (ex: modo privado) — segue funcionando só nessa sessão
        }
      }
      return novo
    })
  }

  return [colunas, alternar]
}
