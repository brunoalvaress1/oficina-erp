import { useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { buscarClientePorCpfCnpj } from '@/features/clientes/services/clienteService'
import { useConsultaCpf } from '@/features/clientes/hooks/useConsultaCpf'
import { buscarEnderecoPorCep } from '@/utils/cep'
import { formatCpfCnpj, formatPhone, formatCep } from '@/utils/format'
import { clienteBlockValueDoExistente, clienteBlockValueVazio, type ClienteBlockValue } from '../types/veiculoClienteForm'

interface ClienteBlockProps {
  value: ClienteBlockValue
  onChange: (valor: ClienteBlockValue) => void
  tentouSalvar: boolean
  disabled?: boolean
}

export function ClienteBlock({ value, onChange, tentouSalvar, disabled }: ClienteBlockProps) {
  const [buscandoNoBanco, setBuscandoNoBanco] = useState(false)
  const [buscandoCep, setBuscandoCep] = useState(false)
  const consultaCpf = useConsultaCpf()
  const documentoConsultado = useRef<string | null>(null)
  const cepConsultado = useRef<string | null>(null)

  function atualizar(alteracoes: Partial<ClienteBlockValue>) {
    onChange({ ...value, ...alteracoes })
  }

  async function handleCpfCnpjChange(digitado: string) {
    const formatado = formatCpfCnpj(digitado)

    // Qualquer edição no documento invalida os dados do cliente anterior — sem isso,
    // nome/endereço/etc de um CPF antigo ficavam "grudados" num documento novo.
    onChange({ ...clienteBlockValueVazio(), cpfCnpj: formatado })
    documentoConsultado.current = null

    const digitos = formatado.replace(/\D/g, '')
    if (digitos.length !== 11 && digitos.length !== 14) return
    documentoConsultado.current = formatado

    setBuscandoNoBanco(true)
    try {
      const clienteDoBanco = await buscarClientePorCpfCnpj(formatado)
      if (clienteDoBanco) {
        onChange(clienteBlockValueDoExistente(clienteDoBanco))
        return
      }

      // CNPJ (pessoa jurídica) não tem consulta de nome/nascimento — só CPF.
      if (digitos.length !== 11) return

      consultaCpf.mutate(formatado, {
        onSuccess: (dados) => {
          if (!dados) return
          onChange({
            ...clienteBlockValueVazio(),
            cpfCnpj: formatado,
            nome: dados.nome || '',
            dataNascimento: dados.dataNascimento || '',
            sexo: dados.sexo || '',
          })
        },
      })
    } finally {
      setBuscandoNoBanco(false)
    }
  }

  function handleTrocarDocumentoManualmente() {
    if (value.clienteExistente) {
      atualizar({ clienteExistente: null })
      documentoConsultado.current = null
    }
  }

  async function handleCepChange(digitado: string) {
    const formatado = formatCep(digitado)
    atualizar({ cep: formatado })

    const cepLimpo = formatado.replace(/\D/g, '')
    if (cepLimpo.length !== 8) return
    if (cepConsultado.current === cepLimpo) return
    cepConsultado.current = cepLimpo

    setBuscandoCep(true)
    try {
      const endereco = await buscarEnderecoPorCep(cepLimpo)
      if (!endereco) return
      atualizar({
        endereco: endereco.endereco,
        bairro: endereco.bairro,
        cidade: endereco.cidade,
        estado: endereco.estado,
        codigoCidade: endereco.codigoCidade || value.codigoCidade,
      })
    } finally {
      setBuscandoCep(false)
    }
  }

  const somenteLeituraCampos = disabled || Boolean(value.clienteExistente)
  const digitosDocumento = value.cpfCnpj.replace(/\D/g, '')
  const ehPessoaJuridica = digitosDocumento.length === 14

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <h2 className="font-medium">Dados do Cliente</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">CPF/CNPJ *</label>
          <div className="relative">
            <input
              value={value.cpfCnpj}
              onChange={(e) => handleCpfCnpjChange(e.target.value)}
              onFocus={handleTrocarDocumentoManualmente}
              disabled={disabled}
              className={`w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 disabled:opacity-50 ${
                tentouSalvar && !value.cpfCnpj.trim() ? 'border-destructive focus:ring-destructive/40' : 'focus:ring-primary/30'
              }`}
            />
            {(buscandoNoBanco || consultaCpf.isPending) && (
              <Loader2 size={14} className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            )}
          </div>
          {value.clienteExistente ? (
            <p className="text-xs text-green-600">
              Cliente já cadastrado — dados preenchidos automaticamente (telefone e e-mail podem ser trocados aqui)
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Documento novo — preencha os dados do cliente</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Nome Completo *</label>
          <input
            value={value.nome}
            onChange={(e) => atualizar({ nome: e.target.value })}
            disabled={somenteLeituraCampos}
            className={`w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 disabled:opacity-50 ${
              tentouSalvar && !value.nome.trim() ? 'border-destructive focus:ring-destructive/40' : 'focus:ring-primary/30'
            }`}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Telefone {ehPessoaJuridica ? '*' : ''}</label>
          <input
            value={value.telefone}
            onChange={(e) => atualizar({ telefone: formatPhone(e.target.value) })}
            disabled={disabled}
            className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">E-mail</label>
          <input
            value={value.email}
            onChange={(e) => atualizar({ email: e.target.value })}
            disabled={disabled}
            className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">CEP {ehPessoaJuridica ? '*' : ''}</label>
          <div className="relative">
            <input
              value={value.cep}
              onChange={(e) => handleCepChange(e.target.value)}
              disabled={somenteLeituraCampos}
              className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
            />
            {buscandoCep && (
              <Loader2 size={14} className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            )}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Rua</label>
          <input
            value={value.endereco}
            onChange={(e) => atualizar({ endereco: e.target.value })}
            disabled={somenteLeituraCampos}
            className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Número</label>
          <input
            value={value.numero}
            onChange={(e) => atualizar({ numero: e.target.value })}
            disabled={somenteLeituraCampos}
            className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Complemento</label>
          <input
            value={value.complemento}
            onChange={(e) => atualizar({ complemento: e.target.value })}
            disabled={somenteLeituraCampos}
            className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Bairro</label>
          <input
            value={value.bairro}
            disabled
            className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none opacity-50"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Cidade/UF</label>
          <input
            value={value.cidade ? `${value.cidade}${value.estado ? `/${value.estado}` : ''}` : ''}
            disabled
            className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none opacity-50"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Sexo</label>
          <select
            value={value.sexo}
            onChange={(e) => atualizar({ sexo: e.target.value })}
            disabled={somenteLeituraCampos}
            className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
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
            value={value.dataNascimento}
            onChange={(e) => atualizar({ dataNascimento: e.target.value })}
            disabled={somenteLeituraCampos}
            className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
          />
        </div>
      </div>

      {tentouSalvar && !value.codigoCidade.trim() && (
        <p className="text-xs text-destructive">
          Código da cidade (IBGE) não encontrado — confira o CEP informado (obrigatório para emissão de nota fiscal).
        </p>
      )}
    </div>
  )
}
