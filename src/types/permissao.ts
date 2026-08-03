export interface Permissao {
  id: string
  codigo: string
  descricao: string
  categoria: string
}

export interface Funcionario {
  id: string
  userId: string
  oficinaId: string
  nome: string
  cargo: string | null
  ativo: boolean
}