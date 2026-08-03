import { z } from 'zod'

const campoObrigatorio = () => z.preprocess((valor) => (typeof valor === 'string' ? valor : ''), z.string())

export const produtoCsvRowSchema = z.object({
  nome: campoObrigatorio().pipe(z.string().min(1, 'Nome é obrigatório')),
  categoria: z.string().optional(),
  subcategoria: z.string().optional(),
  marca: z.string().optional(),
  codigoFabricante: z.string().optional(),
  codigoInterno: z.string().optional(),
  valorCusto: z.string().optional(),
  valorOs: z.string().optional(),
  estoqueFisico: z.string().optional(),
  ncm: z.string().optional(),
  observacoes: z.string().optional(),
})

export type ProdutoCsvRowValidado = z.infer<typeof produtoCsvRowSchema>
