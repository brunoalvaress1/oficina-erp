import { z } from 'zod'

export const fornecedorSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  cnpjCpf: z.string().optional(),
  vendedor: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  endereco: z.string().optional(),
  observacoes: z.string().optional(),
})

export type FornecedorFormValues = z.infer<typeof fornecedorSchema>
