import { z } from 'zod'

const campoObrigatorio = () => z.preprocess((valor) => (typeof valor === 'string' ? valor : ''), z.string())

export const veiculoCsvRowSchema = z
  .object({
    placa: campoObrigatorio().pipe(z.string().min(7, 'Placa inválida').max(8, 'Placa inválida')),
    modelo: campoObrigatorio().pipe(z.string().min(1, 'Modelo é obrigatório')),
    marca: z.string().optional(),
    cor: z.string().optional(),
    ano: z.string().optional(),
    kmAtual: z.string().optional(),
    clienteCpfCnpj: z.string().optional(),
    clienteNome: z.string().optional(),
    observacoes: z.string().optional(),
  })
  .refine((row) => Boolean(row.clienteCpfCnpj?.trim() || row.clienteNome?.trim()), {
    message: 'Informe o CPF/CNPJ ou o nome do cliente',
    path: ['clienteCpfCnpj'],
  })

export type VeiculoCsvRowValidado = z.infer<typeof veiculoCsvRowSchema>
