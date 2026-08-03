export interface PerfilPermissao {
  id: string
  oficinaId: string
  nome: string
  codigos: string[]
  createdAt: string
  updatedAt: string
}

export interface PerfilPermissaoInput {
  nome: string
  codigos: string[]
}
