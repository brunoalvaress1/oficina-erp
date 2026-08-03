import { z } from 'zod'

export const produtoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  categoria: z.string().optional(),
  subcategoria: z.string().optional(),
  marca: z.string().optional(),
  codigoFabricante: z.string().optional(),
  codigoInterno: z.string().optional(),
  codigoBarras: z.string().optional(),
  valorCusto: z.string().optional(),
  valorOs: z.string().optional(),
  estoqueFisico: z.string().optional(),
  ncm: z.string().optional(),
  impostoId: z.string().optional(),
  observacoes: z.string().optional(),
})

export type ProdutoFormValues = z.infer<typeof produtoSchema>
