import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { fornecedorSchema, type FornecedorFormValues } from '../schemas/fornecedorSchema'
import { formatCpfCnpj, formatPhone } from '@/utils/format'
import type { Fornecedor } from '../types/fornecedor'

interface FornecedorFormProps {
  fornecedorExistente?: Fornecedor
  onSubmit: (values: FornecedorFormValues) => void
  isSubmitting: boolean
}

export function FornecedorForm({ fornecedorExistente, onSubmit, isSubmitting }: FornecedorFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FornecedorFormValues>({
    resolver: zodResolver(fornecedorSchema),
    defaultValues: {
      nome: fornecedorExistente?.nome ?? '',
      cnpjCpf: fornecedorExistente?.cnpjCpf ?? '',
      vendedor: fornecedorExistente?.vendedor ?? '',
      telefone: fornecedorExistente?.telefone ?? '',
      email: fornecedorExistente?.email ?? '',
      endereco: fornecedorExistente?.endereco ?? '',
      observacoes: fornecedorExistente?.observacoes ?? '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1">
          <label className="text-sm font-medium">Nome *</label>
          <input
            {...register('nome')}
            className="w-full h-9 px-3 rounded-md border bg-transparent text-sm outline-none focus:ring-1 focus:ring-primary"
          />
          {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">CNPJ/CPF</label>
          <input
            {...register('cnpjCpf')}
            onChange={(e) => setValue('cnpjCpf', formatCpfCnpj(e.target.value))}
            className="w-full h-9 px-3 rounded-md border bg-transparent text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Vendedor</label>
          <input
            {...register('vendedor')}
            className="w-full h-9 px-3 rounded-md border bg-transparent text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Telefone</label>
          <input
            {...register('telefone')}
            onChange={(e) => setValue('telefone', formatPhone(e.target.value))}
            className="w-full h-9 px-3 rounded-md border bg-transparent text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">E-mail</label>
          <input
            {...register('email')}
            className="w-full h-9 px-3 rounded-md border bg-transparent text-sm outline-none focus:ring-1 focus:ring-primary"
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="col-span-2 space-y-1">
          <label className="text-sm font-medium">Endereço</label>
          <input
            {...register('endereco')}
            className="w-full h-9 px-3 rounded-md border bg-transparent text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="col-span-2 space-y-1">
          <label className="text-sm font-medium">Observações</label>
          <input
            {...register('observacoes')}
            className="w-full h-9 px-3 rounded-md border bg-transparent text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
      >
        {isSubmitting ? 'Salvando...' : 'Salvar Fornecedor'}
      </button>
    </form>
  )
}
