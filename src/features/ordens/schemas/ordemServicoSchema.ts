import { z } from 'zod'

export const ordemServicoSchema = z.object({
  veiculoId: z.string().min(1, 'Selecione o veículo'),
  responsavelId: z.string().min(1, 'Selecione o responsável pela ordem'),
  mecanicoId: z.string().optional(),
  numeroPrisma: z.string().optional(),
  dataAbertura: z.string().min(1, 'Informe a data de abertura'),
  dataEntrada: z.string().min(1, 'Informe a data de entrada'),
  kmAtual: z.string().min(1, 'Informe a quilometragem atual'),
  defeitosRelatados: z.string().optional(),
  observacoesInternas: z.string().optional(),
})

export type OrdemServicoFormValues = z.infer<typeof ordemServicoSchema>
