import { useRef, useState } from 'react'
import { Car, Loader2, Search, UserCog } from 'lucide-react'
import { buscarVeiculoPorPlaca } from '@/features/veiculos/services/veiculoService'
import { useConsultaPlaca } from '@/features/veiculos/hooks/useConsultaPlaca'
import { VeiculoModal } from '@/features/veiculos/components/VeiculoModal'
import { PermissionGate } from '@/features/veiculos/components/PermissionGate'
import { veiculoBlockValueDoExistente, veiculoBlockValueVazio, type VeiculoBlockValue } from '../types/veiculoClienteForm'

interface VeiculoBlockProps {
  value: VeiculoBlockValue
  onChange: (valor: VeiculoBlockValue) => void
  kmAtual: string
  onChangeKmAtual: (valor: string) => void
  kmAnterior: number | null
  tentouSalvar: boolean
  disabled?: boolean
  // Avisa o formulário pai que a busca automática da placa no nosso banco
  // está rodando, pra ele travar o "Salvar" até terminar — sem isso, salvar
  // rápido demais depois de digitar/colar uma placa que já existe tentava
  // CRIAR o veículo de novo (ainda não sabíamos que já existia) e batia na
  // trava de placa duplicada do banco.
  onBuscandoChange?: (buscando: boolean) => void
}

export function VeiculoBlock({
  value,
  onChange,
  kmAtual,
  onChangeKmAtual,
  kmAnterior,
  tentouSalvar,
  disabled,
  onBuscandoChange,
}: VeiculoBlockProps) {
  const [buscandoNoBanco, setBuscandoNoBanco] = useState(false)
  const [modalDonoAberto, setModalDonoAberto] = useState(false)
  const consultaPlaca = useConsultaPlaca()
  const placaConsultada = useRef<string | null>(null)

  function atualizar(alteracoes: Partial<VeiculoBlockValue>) {
    onChange({ ...value, ...alteracoes })
  }

  async function handlePlacaChange(placaDigitada: string) {
    const placaFormatada = placaDigitada.toUpperCase().replace(/[^A-Z0-9]/g, '')

    // Qualquer edição na placa invalida os dados do veículo anterior — sem isso,
    // marca/modelo/etc de uma placa antiga ficavam "grudados" numa placa nova.
    onChange({ ...veiculoBlockValueVazio(), placa: placaFormatada })
    placaConsultada.current = null

    if (placaFormatada.length < 7) return
    placaConsultada.current = placaFormatada

    // Busca no nosso banco é grátis, então continua automática. A consulta na
    // API externa é paga — vira botão manual (ver handleBuscarNaApi).
    setBuscandoNoBanco(true)
    onBuscandoChange?.(true)
    try {
      const veiculoDoBanco = await buscarVeiculoPorPlaca(placaFormatada)
      if (veiculoDoBanco) {
        onChange(veiculoBlockValueDoExistente(veiculoDoBanco))
      }
    } finally {
      setBuscandoNoBanco(false)
      onBuscandoChange?.(false)
    }
  }

  function handleBuscarNaApi() {
    const placaFormatada = value.placa.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (placaFormatada.length < 7) return

    consultaPlaca.mutate(placaFormatada, {
      onSuccess: (dados) => {
        if (!dados) return
        onChange({
          veiculoExistente: null,
          placa: placaFormatada,
          marca: dados.marca || '',
          modelo: dados.modelo || '',
          cor: dados.cor || '',
          ano: dados.ano || '',
          anoModelo: dados.anoModelo || '',
          chassi: dados.chassi || '',
          motor: dados.motor || '',
          combustivel: dados.combustivel || '',
          opcionais: '',
        })
      },
    })
  }

  function handleTrocarPlacaManualmente() {
    if (value.veiculoExistente) {
      atualizar({ veiculoExistente: null })
      placaConsultada.current = null
    }
  }

  const somenteLeituraCampos = disabled || Boolean(value.veiculoExistente)
  const kmMenorQueAnterior = kmAnterior != null && kmAtual.trim() !== '' && Number(kmAtual) < kmAnterior
  // Veículo é opcional (oficina não usa PDV) — só vira obrigatório campo a
  // campo quando a placa é preenchida (não dá pra ter só um pedaço do
  // veículo cadastrado).
  const veiculoInformado = Boolean(value.placa.trim())

  return (
    <div className="rounded-lg border bg-card shadow-sm p-4 space-y-4">
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center size-7 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Car size={15} />
          </div>
          <h2 className="font-medium">Dados do Veículo (opcional)</h2>
        </div>
        {/* Disponível mesmo com a OS travada (paga/cancelada/enviada ao caixa)
            — trocar o dono é sobre o cadastro do veículo pra frente, não sobre
            reescrever essa OS já fechada. Próximas OS's abertas por essa placa
            já vêm com o dono novo automaticamente. */}
        {value.veiculoExistente && (
          <PermissionGate codigo="veiculos.editar">
            <button
              type="button"
              onClick={() => setModalDonoAberto(true)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-md border text-xs font-medium"
            >
              <UserCog size={13} /> Trocar dono do veículo
            </button>
          </PermissionGate>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">Placa</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                value={value.placa}
                onChange={(e) => handlePlacaChange(e.target.value)}
                onFocus={handleTrocarPlacaManualmente}
                maxLength={7}
                disabled={disabled}
                placeholder="ABC1D23"
                className="w-full h-9 rounded-md border bg-transparent px-3 text-sm uppercase outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
              />
              {buscandoNoBanco && (
                <Loader2 size={14} className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              )}
            </div>
            {!value.veiculoExistente && (
              <button
                type="button"
                onClick={handleBuscarNaApi}
                disabled={disabled || value.placa.replace(/[^A-Z0-9]/g, '').length < 7 || consultaPlaca.isPending}
                title="Buscar dados do veículo pela placa (consome 1 consulta paga)"
                className="h-9 px-3 rounded-md border shrink-0 disabled:opacity-50"
              >
                {consultaPlaca.isPending ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
              </button>
            )}
          </div>
          {value.veiculoExistente ? (
            <p className="text-xs text-green-600">Veículo já cadastrado — dados preenchidos automaticamente (sem custo)</p>
          ) : (
            <p className="text-xs text-muted-foreground">Placa nova — clique na lupa pra buscar os dados (consulta paga) ou preencha manualmente</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Modelo{veiculoInformado ? ' *' : ''}</label>
          <input
            value={value.modelo}
            onChange={(e) => atualizar({ modelo: e.target.value })}
            disabled={disabled || somenteLeituraCampos}
            className={`w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 disabled:opacity-50 ${
              tentouSalvar && veiculoInformado && !value.modelo.trim() ? 'border-destructive focus:ring-destructive/40' : 'focus:ring-primary/30'
            }`}
          />
        </div>

        <CampoTexto label="Marca" valor={value.marca} onChange={(v) => atualizar({ marca: v })} disabled={disabled || somenteLeituraCampos} />
        <CampoTexto label="Ano" valor={value.ano} onChange={(v) => atualizar({ ano: v })} disabled={disabled || somenteLeituraCampos} />
        <CampoTexto label="Ano Modelo" valor={value.anoModelo} onChange={(v) => atualizar({ anoModelo: v })} disabled={disabled || somenteLeituraCampos} />
        <CampoTexto label="Cor" valor={value.cor} onChange={(v) => atualizar({ cor: v })} disabled={disabled || somenteLeituraCampos} />
        <CampoTexto label="Motor" valor={value.motor} onChange={(v) => atualizar({ motor: v })} disabled={disabled || somenteLeituraCampos} />
        <CampoTexto label="Combustível" valor={value.combustivel} onChange={(v) => atualizar({ combustivel: v })} disabled={disabled || somenteLeituraCampos} />
        <CampoTexto label="Chassi" valor={value.chassi} onChange={(v) => atualizar({ chassi: v })} disabled={disabled || somenteLeituraCampos} />
        <div className="space-y-1 md:col-span-2">
          <CampoTexto label="Opcionais" valor={value.opcionais} onChange={(v) => atualizar({ opcionais: v })} disabled={disabled || somenteLeituraCampos} />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Quilometragem Atual{veiculoInformado ? ' *' : ''}</label>
          <input
            value={kmAtual}
            onChange={(e) => onChangeKmAtual(e.target.value.replace(/\D/g, ''))}
            inputMode="numeric"
            disabled={disabled}
            className={`w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 disabled:opacity-50 ${
              tentouSalvar && veiculoInformado && !kmAtual.trim() ? 'border-destructive focus:ring-destructive/40' : 'focus:ring-primary/30'
            }`}
          />
          {kmAnterior != null && (
            <p className="text-xs text-muted-foreground">KM anterior: {kmAnterior.toLocaleString('pt-BR')}</p>
          )}
          {kmMenorQueAnterior && (
            <p className="text-xs text-amber-600">
              Atenção: KM informado é menor que o anterior. Confirme antes de salvar.
            </p>
          )}
        </div>
      </div>

      {value.veiculoExistente && (
        <VeiculoModal
          open={modalDonoAberto}
          onOpenChange={setModalDonoAberto}
          veiculoExistente={value.veiculoExistente}
          onSalvo={(veiculo) => onChange(veiculoBlockValueDoExistente(veiculo))}
        />
      )}
    </div>
  )
}

function CampoTexto({
  label,
  valor,
  onChange,
  disabled,
}: {
  label: string
  valor: string
  onChange: (valor: string) => void
  disabled?: boolean
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <input
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
      />
    </div>
  )
}
