import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { clienteSchema, type ClienteFormValues } from '../schemas/clienteSchema'
import { buscarEnderecoPorCep } from '@/utils/cep'
import { formatCpfCnpj, formatPhone, formatCep } from '@/utils/format'
import type { Cliente } from '../types/cliente'

interface ClienteFormProps {
  clienteExistente?: Cliente
  onSubmit: (values: ClienteFormValues) => void
  isSubmitting: boolean
}

export function ClienteForm({ clienteExistente, onSubmit, isSubmitting }: ClienteFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nome: clienteExistente?.nome ?? '',
      cpfCnpj: clienteExistente?.cpfCnpj ?? '',
      telefone: clienteExistente?.telefone ?? '',
      email: clienteExistente?.email ?? '',
      cep: clienteExistente?.cep ?? '',
      endereco: clienteExistente?.endereco ?? '',
      numero: clienteExistente?.numero ?? '',
      bairro: clienteExistente?.bairro ?? '',
      cidade: clienteExistente?.cidade ?? '',
      estado: clienteExistente?.estado ?? '',
      codigoCidade: clienteExistente?.codigoCidade ?? '',
      sexo: clienteExistente?.sexo ?? '',
      dataNascimento: clienteExistente?.dataNascimento ?? '',
      observacoes: clienteExistente?.observacoes ?? '',
      inscricaoEstadual: clienteExistente?.inscricaoEstadual ?? '',
    },
  })

  const cep = watch('cep')
  const cpfCnpj = watch('cpfCnpj')
  const ehPessoaJuridica = (cpfCnpj ?? '').replace(/\D/g, '').length === 14

  useEffect(() => {
    const cepLimpo = (cep ?? '').replace(/\D/g, '')
    if (cepLimpo.length !== 8) return

    buscarEnderecoPorCep(cepLimpo).then((endereco) => {
      if (!endereco) return
      setValue('endereco', endereco.endereco)
      setValue('bairro', endereco.bairro)
      setValue('cidade', endereco.cidade)
      setValue('estado', endereco.estado)
      if (endereco.codigoCidade) setValue('codigoCidade', endereco.codigoCidade)
    })
  }, [cep, setValue])

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
          <label className="text-sm font-medium">CPF/CNPJ</label>
          <input
            {...register('cpfCnpj')}
            onChange={(e) => setValue('cpfCnpj', formatCpfCnpj(e.target.value))}
            className="w-full h-9 px-3 rounded-md border bg-transparent text-sm outline-none focus:ring-1 focus:ring-primary"
          />
          {errors.cpfCnpj && <p className="text-xs text-destructive">{errors.cpfCnpj.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Telefone</label>
          <input
            {...register('telefone')}
            onChange={(e) => setValue('telefone', formatPhone(e.target.value))}
            className="w-full h-9 px-3 rounded-md border bg-transparent text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {ehPessoaJuridica && (
          <div className="col-span-2 space-y-1">
            <label className="text-sm font-medium">Inscrição Estadual</label>
            <input
              {...register('inscricaoEstadual')}
              placeholder="Deixe em branco se o cliente for isento de IE"
              className="w-full h-9 px-3 rounded-md border bg-transparent text-sm outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground">
              Obrigatória para emitir nota fiscal a clientes pessoa jurídica que são contribuintes de ICMS —
              sem ela, a Sefaz pode rejeitar a nota com "IE do destinatário não informada".
            </p>
          </div>
        )}

        <div className="col-span-2 space-y-1">
          <label className="text-sm font-medium">E-mail</label>
          <input
            {...register('email')}
            className="w-full h-9 px-3 rounded-md border bg-transparent text-sm outline-none focus:ring-1 focus:ring-primary"
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">CEP</label>
          <input
            {...register('cep')}
            onChange={(e) => setValue('cep', formatCep(e.target.value))}
            className="w-full h-9 px-3 rounded-md border bg-transparent text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Número</label>
          <input
            {...register('numero')}
            className="w-full h-9 px-3 rounded-md border bg-transparent text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="col-span-2 space-y-1">
          <label className="text-sm font-medium">Endereço</label>
          <input
            {...register('endereco')}
            className="w-full h-9 px-3 rounded-md border bg-transparent text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Bairro</label>
          <input
            {...register('bairro')}
            className="w-full h-9 px-3 rounded-md border bg-transparent text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Cidade</label>
          <input
            {...register('cidade')}
            className="w-full h-9 px-3 rounded-md border bg-transparent text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Código da Cidade (IBGE) *</label>
          <input
            {...register('codigoCidade')}
            placeholder="Preenchido automaticamente pelo CEP"
            className="w-full h-9 px-3 rounded-md border bg-transparent text-sm outline-none focus:ring-1 focus:ring-primary"
          />
          {errors.codigoCidade && <p className="text-xs text-destructive">{errors.codigoCidade.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Sexo</label>
          <select
            {...register('sexo')}
            className="w-full h-9 px-3 rounded-md border bg-transparent text-sm outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Não informado</option>
            <option value="Masculino">Masculino</option>
            <option value="Feminino">Feminino</option>
            <option value="Outro">Outro</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Data de Nascimento</label>
          <input
            type="date"
            {...register('dataNascimento')}
            className="w-full h-9 px-3 rounded-md border bg-transparent text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
      >
        {isSubmitting ? 'Salvando...' : 'Salvar Cliente'}
      </button>
    </form>
  )
}