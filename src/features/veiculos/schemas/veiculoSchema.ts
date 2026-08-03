import { z } from 'zod'

export const veiculoSchema = z.object({
  clienteId: z.string().min(1, 'Selecione um cliente'),
  placa: z.string().min(7, 'Placa inválida').max(8, 'Placa inválida'),
  marca: z.string().optional(),
  modelo: z.string().min(1, 'Modelo é obrigatório'),
  cor: z.string().optional(),
  ano: z.string().optional(),
  anoModelo: z.string().optional(),
  chassi: z.string().optional(),
  kmAtual: z.string().optional(),
  combustivel: z.string().optional(),
  motor: z.string().optional(),
  opcionais: z.string().optional(),
  observacoes: z.string().optional(),
})

export type VeiculoFormValues = z.infer<typeof veiculoSchema>