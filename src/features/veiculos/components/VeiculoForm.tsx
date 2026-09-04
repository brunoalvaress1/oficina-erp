import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Search } from 'lucide-react'
import { toast } from 'sonner'

import { veiculoSchema, type VeiculoFormValues } from '../schemas/veiculoSchema'
import type { Veiculo } from '../types/veiculo'
import { useConsultaPlaca } from '../hooks/useConsultaPlaca'

import { Combobox } from '@/components/ui/Combobox'
import { useClientesBusca, type ClienteBusca } from '@/features/clientes/hooks/useClientesBusca'
import { formatCpfCnpj, formatPhone } from '@/utils/format'

interface VeiculoFormProps {
  veiculoExistente?: Veiculo
  onSubmit: (values: VeiculoFormValues) => void
  isSubmitting: boolean
}

export function VeiculoForm({
  veiculoExistente,
  onSubmit,
  isSubmitting,
}: VeiculoFormProps) {
  const [termoBuscaCliente, setTermoBuscaCliente] = useState('')
  const [clienteSelecionado, setClienteSelecionado] = useState<ClienteBusca | null>(
    veiculoExistente
      ? { id: veiculoExistente.clienteId, nome: veiculoExistente.clienteNome ?? '', cpf_cnpj: null, telefone: null }
      : null,
  )
  const { data: clientesEncontrados = [], isLoading: buscandoClientes } = useClientesBusca(termoBuscaCliente)
  const consultaPlaca = useConsultaPlaca()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<VeiculoFormValues>({
    resolver: zodResolver(veiculoSchema),
    defaultValues: {
      clienteId: veiculoExistente?.clienteId ?? '',
      placa: veiculoExistente?.placa ?? '',
      marca: veiculoExistente?.marca ?? '',
      modelo: veiculoExistente?.modelo ?? '',
      cor: veiculoExistente?.cor ?? '',
      ano: veiculoExistente?.ano ?? '',
      anoModelo: veiculoExistente?.anoModelo ?? '',
      chassi: veiculoExistente?.chassi ?? '',
      kmAtual:
        veiculoExistente?.kmAtual != null
          ? String(veiculoExistente.kmAtual)
          : undefined,
      combustivel: veiculoExistente?.combustivel ?? '',
      motor: veiculoExistente?.motor ?? '',
      opcionais: veiculoExistente?.opcionais ?? '',
      observacoes: veiculoExistente?.observacoes ?? '',
    },
  })

  const placa = watch('placa')
  const placaLimpa = (placa ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '')

  // Consulta é manual (botão "Buscar") — cada chamada é uma consulta paga na
  // API PuxaPlaca, não queremos gastar sozinho só porque o usuário digitou.
  function handleBuscarPlaca() {
    if (placaLimpa.length < 7) return

    consultaPlaca.mutate(placaLimpa, {
      onSuccess: (dados) => {
        if (!dados) return

        const valoresAtuais = getValues()
        if (!valoresAtuais.marca && dados.marca) setValue('marca', dados.marca)
        if (!valoresAtuais.modelo && dados.modelo) setValue('modelo', dados.modelo)
        if (!valoresAtuais.cor && dados.cor) setValue('cor', dados.cor)
        if (!valoresAtuais.ano && dados.ano) setValue('ano', dados.ano)
        if (!valoresAtuais.anoModelo && dados.anoModelo) setValue('anoModelo', dados.anoModelo)
        if (!valoresAtuais.chassi && dados.chassi) setValue('chassi', dados.chassi)
        if (!valoresAtuais.motor && dados.motor) setValue('motor', dados.motor)
        if (!valoresAtuais.combustivel && dados.combustivel) setValue('combustivel', dados.combustivel)
      },
      onError: (error: Error) => toast.error('Não foi possível buscar os dados dessa placa', { description: error.message }),
    })
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
    >
      <div className="grid grid-cols-2 gap-4">

        {/* Cliente */}

        <div className="col-span-2 space-y-1">
          <label className="text-sm font-medium">
            Cliente *
          </label>

          <Combobox<ClienteBusca>
            value={clienteSelecionado}
            onSelect={(cliente) => {
              setClienteSelecionado(cliente)
              setValue('clienteId', cliente.id, { shouldValidate: true })
            }}
            onSearch={setTermoBuscaCliente}
            items={clientesEncontrados}
            isLoading={buscandoClientes}
            getKey={(c) => c.id}
            getLabel={(c) => c.nome}
            getDescription={(c) =>
              [c.cpf_cnpj ? formatCpfCnpj(c.cpf_cnpj) : null, c.telefone ? formatPhone(c.telefone) : null]
                .filter(Boolean)
                .join(' · ') || undefined
            }
            placeholder="Buscar cliente por nome, CPF/CNPJ ou telefone..."
            emptyMessage="Nenhum cliente encontrado"
          />

          {errors.clienteId && (
            <p className="text-xs text-destructive">
              {errors.clienteId.message}
            </p>
          )}
        </div>

        {/* Placa */}

        <div className="space-y-1">
          <label className="text-sm font-medium">
            Placa *
          </label>

          <div className="flex gap-2">
            <input
              {...register('placa')}
              maxLength={7}
              className="w-full h-9 rounded-md border bg-transparent px-3 text-sm uppercase outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={handleBuscarPlaca}
              disabled={placaLimpa.length < 7 || consultaPlaca.isPending}
              title="Buscar dados do veículo pela placa (consome 1 consulta)"
              className="h-9 px-3 rounded-md border shrink-0 disabled:opacity-50"
            >
              <Search size={15} />
            </button>
          </div>

          {errors.placa && (
            <p className="text-xs text-destructive">
              {errors.placa.message}
            </p>
          )}

          {consultaPlaca.isPending && (
            <p className="text-xs text-muted-foreground">
              Buscando dados do veículo...
            </p>
          )}
        </div>

        {/* Modelo */}

        <div className="space-y-1">
          <label className="text-sm font-medium">
            Modelo *
          </label>

          <input
            {...register('modelo')}
            className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary"
          />

          {errors.modelo && (
            <p className="text-xs text-destructive">
              {errors.modelo.message}
            </p>
          )}
        </div>

        {/* Marca */}

        <div className="space-y-1">
          <label className="text-sm font-medium">
            Marca
          </label>

          <input
            {...register('marca')}
            className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Cor */}

        <div className="space-y-1">
          <label className="text-sm font-medium">
            Cor
          </label>

          <input
            {...register('cor')}
            className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Ano */}

        <div className="space-y-1">
          <label className="text-sm font-medium">
            Ano
          </label>

          <input
            {...register('ano')}
            className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Ano Modelo */}

        <div className="space-y-1">
          <label className="text-sm font-medium">
            Ano Modelo
          </label>

          <input
            {...register('anoModelo')}
            className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Chassi */}

        <div className="space-y-1">
          <label className="text-sm font-medium">
            Chassi
          </label>

          <input
            {...register('chassi')}
            className="w-full h-9 rounded-md border bg-transparent px-3 text-sm uppercase outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* KM */}

        <div className="space-y-1">
          <label className="text-sm font-medium">
            KM Atual
          </label>

          <input
            {...register('kmAtual')}
            inputMode="numeric"
            className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Combustível */}

        <div className="space-y-1">
          <label className="text-sm font-medium">
            Combustível
          </label>

          <input
            {...register('combustivel')}
            className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Motor */}

        <div className="space-y-1">
          <label className="text-sm font-medium">
            Motor
          </label>

          <input
            {...register('motor')}
            className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Opcionais */}

        <div className="col-span-2 space-y-1">
          <label className="text-sm font-medium">
            Opcionais
          </label>

          <input
            {...register('opcionais')}
            placeholder="Ar condicionado, direção hidráulica, vidro elétrico..."
            className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Observações */}

        <div className="col-span-2 space-y-1">
          <label className="text-sm font-medium">
            Observações
          </label>

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
        {isSubmitting ? 'Salvando...' : 'Salvar Veículo'}
      </button>
    </form>
  )
}