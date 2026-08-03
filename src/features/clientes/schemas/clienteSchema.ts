import { z } from 'zod'

export const clienteSchema = z
  .object({
    nome: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
    cpfCnpj: z.string().optional(),
    telefone: z.string().optional(),
    email: z.string().email('E-mail inválido').optional().or(z.literal('')),
    cep: z.string().optional(),
    endereco: z.string().optional(),
    numero: z.string().optional(),
    bairro: z.string().optional(),
    cidade: z.string().optional(),
    estado: z.string().optional(),
    codigoCidade: z.string().min(1, 'Código da cidade (IBGE) é obrigatório para emissão de nota fiscal'),
    sexo: z.string().optional(),
    dataNascimento: z.string().optional(),
    observacoes: z.string().optional(),
  })
  // Pessoa Jurídica (CNPJ, 14 dígitos): telefone e CEP passam a ser obrigatórios.
  .superRefine((valores, contexto) => {
    const digitos = (valores.cpfCnpj ?? '').replace(/\D/g, '')
    if (digitos.length !== 14) return

    if (!valores.telefone?.trim()) {
      contexto.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['telefone'],
        message: 'Telefone é obrigatório para Pessoa Jurídica',
      })
    }
    if (!valores.cep?.trim()) {
      contexto.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['cep'],
        message: 'CEP é obrigatório para Pessoa Jurídica',
      })
    }
  })

export type ClienteFormValues = z.infer<typeof clienteSchema>