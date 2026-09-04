import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { CampoMoeda } from '@/components/ui/CampoMoeda'
import { useImpostos } from '@/features/configuracoes/hooks/useImpostos'
import { produtoSchema, type ProdutoFormValues } from '../schemas/produtoSchema'
import type { Produto } from '../types/produto'

interface ProdutoFormProps {
  produtoExistente?: Produto
  onSubmit: (values: ProdutoFormValues) => void
  isSubmitting: boolean
}

export function ProdutoForm({ produtoExistente, onSubmit, isSubmitting }: ProdutoFormProps) {
  const { data: impostos } = useImpostos()
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProdutoFormValues>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      nome: produtoExistente?.nome ?? '',
      categoria: produtoExistente?.categoria ?? '',
      subcategoria: produtoExistente?.subcategoria ?? '',
      marca: produtoExistente?.marca ?? '',
      codigoFabricante: produtoExistente?.codigoFabricante ?? '',
      codigoInterno: produtoExistente?.codigoInterno ?? '',
      codigoBarras: produtoExistente?.codigoBarras ?? '',
      valorCusto: produtoExistente ? String(produtoExistente.valorCusto) : '',
      valorOs: produtoExistente ? String(produtoExistente.valorOs) : '',
      estoqueFisico: produtoExistente ? String(produtoExistente.estoqueFisico) : '',
      ncm: produtoExistente?.ncm ?? '',
      impostoId: produtoExistente?.impostoId ?? '',
      observacoes: produtoExistente?.observacoes ?? '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1">
          <label className="text-sm font-medium">Nome *</label>
          <input
            {...register('nome')}
            className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary"
          />
          {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Categoria</label>
          <input
            {...register('categoria')}
            className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Subcategoria</label>
          <input
            {...register('subcategoria')}
            className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Marca</label>
          <input
            {...register('marca')}
            className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">NCM</label>
          <input
            {...register('ncm')}
            className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Código Fabricante</label>
          <input
            {...register('codigoFabricante')}
            className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Código Interno</label>
          <input
            {...register('codigoInterno')}
            className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Código de Barras</label>
          <input
            {...register('codigoBarras')}
            className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Valor Custo</label>
          <Controller
            name="valorCusto"
            control={control}
            render={({ field }) => (
              <CampoMoeda
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary"
              />
            )}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Valor O.S.</label>
          <Controller
            name="valorOs"
            control={control}
            render={({ field }) => (
              <CampoMoeda
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary"
              />
            )}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Estoque Físico</label>
          <input
            {...register('estoqueFisico')}
            type="number"
            className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Imposto (p/ nota fiscal)</label>
          <select
            {...register('impostoId')}
            className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Nenhum</option>
            {(impostos ?? []).map((imposto) => (
              <option key={imposto.id} value={imposto.id}>
                {imposto.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-2 space-y-1">
          <label className="text-sm font-medium">Observações</label>
          <textarea
            {...register('observacoes')}
            rows={4}
            className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? 'Salvando...' : 'Salvar Produto'}
      </button>
    </form>
  )
}
