import { useEffect, useRef, useState } from 'react'
import { Loader2, User } from 'lucide-react'
import { useDebouncedCallback } from 'use-debounce'
import { buscarClientePorCpfCnpj, buscarClientePorId } from '@/features/clientes/services/clienteService'
import { useConsultaCpf } from '@/features/clientes/hooks/useConsultaCpf'
import { useConsultaCnpj } from '@/features/clientes/hooks/useConsultaCnpj'
import { useClienteSearch } from '@/features/clientes/hooks/useClienteSearch'
import { buscarEnderecoPorCep } from '@/utils/cep'
import { formatCpfCnpj, formatPhone, formatCep, capitalizarPalavras } from '@/utils/format'
import { cpfCnpjValidoOuVazio } from '@/utils/cpfCnpj'
import { clienteBlockValueDoExistente, clienteBlockValueVazio, type ClienteBlockValue } from '../types/veiculoClienteForm'
import type { Cliente } from '@/features/clientes/types/cliente'

interface ClienteBlockProps {
  value: ClienteBlockValue
  onChange: (valor: ClienteBlockValue) => void
  tentouSalvar: boolean
  disabled?: boolean
}

export function ClienteBlock({ value, onChange, tentouSalvar, disabled }: ClienteBlockProps) {
  const [buscandoNoBanco, setBuscandoNoBanco] = useState(false)
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [buscaNomeAberta, setBuscaNomeAberta] = useState(false)
  const [termoBuscaNome, setTermoBuscaNome] = useState('')
  const consultaCpf = useConsultaCpf()
  const consultaCnpj = useConsultaCnpj()
  const documentoConsultado = useRef<string | null>(null)
  const cepConsultado = useRef<string | null>(null)
  const nomeContainerRef = useRef<HTMLDivElement>(null)
  const atualizarTermoBuscaNome = useDebouncedCallback((termo: string) => setTermoBuscaNome(termo), 300)
  const { data: clientesEncontradosPorNome, isLoading: buscandoPorNome } = useClienteSearch({
    search: value.clienteExistente ? '' : termoBuscaNome,
  })

  useEffect(() => {
    function handleClickFora(event: MouseEvent) {
      if (nomeContainerRef.current && !nomeContainerRef.current.contains(event.target as Node)) {
        setBuscaNomeAberta(false)
      }
    }
    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
  }, [])

  function atualizar(alteracoes: Partial<ClienteBlockValue>) {
    onChange({ ...value, ...alteracoes })
  }

  // Carrega os dados de um cliente já cadastrado (via CPF/CNPJ ou via busca
  // por nome) e, se o endereço ficou incompleto (comum em cadastros antigos
  // importados), completa automaticamente pelo CEP que já está salvo — assim
  // só falta digitar o número. Só preenche o que está vazio, nunca sobrescreve
  // um valor que já existe (mesmo que pareça estranho, pode ter sido corrigido
  // manualmente antes).
  async function aplicarClienteExistente(cliente: Cliente) {
    const valor = clienteBlockValueDoExistente(cliente)
    onChange(valor)

    const enderecoIncompleto = !valor.endereco.trim() || !valor.bairro.trim() || !valor.codigoCidade.trim()
    const cepLimpo = valor.cep.replace(/\D/g, '')
    if (!enderecoIncompleto || cepLimpo.length !== 8) return

    const endereco = await buscarEnderecoPorCep(cepLimpo)
    if (!endereco) return
    onChange({
      ...valor,
      endereco: valor.endereco.trim() || endereco.endereco,
      bairro: valor.bairro.trim() || endereco.bairro,
      cidade: valor.cidade.trim() || endereco.cidade,
      estado: valor.estado.trim() || endereco.estado,
      codigoCidade: valor.codigoCidade.trim() || endereco.codigoCidade,
    })
  }

  async function handleSelecionarClientePorNome(id: string) {
    setBuscaNomeAberta(false)
    const cliente = await buscarClientePorId(id)
    await aplicarClienteExistente(cliente)
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
        await aplicarClienteExistente(clienteDoBanco)
        return
      }

      if (digitos.length === 11) {
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
        return
      }

      consultaCnpj.mutate(formatado, {
        onSuccess: async (dados) => {
          if (!dados) return
          // Busca o código IBGE da cidade pelo CEP antes de aplicar tudo de
          // uma vez — atualizar isso depois, separado, correria o risco de
          // usar um "value" desatualizado (antes do onChange abaixo re-
          // renderizar) e sobrescrever os outros campos recém-preenchidos.
          const enderecoPorCep = dados.cep ? await buscarEnderecoPorCep(dados.cep) : null
          onChange({
            ...clienteBlockValueVazio(),
            cpfCnpj: formatado,
            nome: dados.nome ? capitalizarPalavras(dados.nome) : '',
            telefone: dados.telefone ? formatPhone(dados.telefone) : '',
            email: dados.email || '',
            cep: dados.cep ? formatCep(dados.cep) : '',
            endereco: dados.endereco ? capitalizarPalavras(dados.endereco) : '',
            numero: dados.numero || '',
            bairro: dados.bairro ? capitalizarPalavras(dados.bairro) : '',
            cidade: dados.cidade ? capitalizarPalavras(dados.cidade) : '',
            estado: dados.estado || '',
            codigoCidade: enderecoPorCep?.codigoCidade || '',
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

  // Nome/sexo/nascimento de um cliente já cadastrado ficam travados aqui (só
  // dá pra mudar na tela de Clientes) — mas endereço (CEP, número,
  // complemento) precisa poder ser completado/corrigido direto na OS, porque
  // muitos clientes antigos foram importados sem esses dados.
  const somenteLeituraCampos = disabled || Boolean(value.clienteExistente)
  const somenteLeituraEndereco = disabled
  const digitosDocumento = value.cpfCnpj.replace(/\D/g, '')
  const ehPessoaJuridica = digitosDocumento.length === 14
  const documentoInvalido = Boolean(digitosDocumento) && !cpfCnpjValidoOuVazio(value.cpfCnpj)

  return (
    <div className="rounded-lg border bg-card shadow-sm p-4 space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center size-7 rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-400">
          <User size={15} />
        </div>
        <h2 className="font-medium">Dados do Cliente</h2>
      </div>

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
                (tentouSalvar && !value.cpfCnpj.trim()) || documentoInvalido
                  ? 'border-destructive focus:ring-destructive/40'
                  : 'focus:ring-primary/30'
              }`}
            />
            {(buscandoNoBanco || consultaCpf.isPending || consultaCnpj.isPending) && (
              <Loader2 size={14} className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            )}
          </div>
          {documentoInvalido ? (
            <p className="text-xs text-destructive">CPF/CNPJ inválido — confira os números digitados</p>
          ) : value.clienteExistente ? (
            <p className="text-xs text-green-600">
              Cliente já cadastrado — dados preenchidos automaticamente (telefone, e-mail e endereço podem ser corrigidos aqui)
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Documento novo — preencha os dados do cliente</p>
          )}
        </div>

        <div className="space-y-1 relative" ref={nomeContainerRef}>
          <label className="text-sm font-medium">Nome Completo *</label>
          <div className="relative">
            <input
              value={value.nome}
              onChange={(e) => {
                atualizar({ nome: e.target.value })
                atualizarTermoBuscaNome(e.target.value)
                setBuscaNomeAberta(true)
              }}
              onFocus={() => setBuscaNomeAberta(true)}
              disabled={somenteLeituraCampos}
              className={`w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 disabled:opacity-50 ${
                tentouSalvar && !value.nome.trim() ? 'border-destructive focus:ring-destructive/40' : 'focus:ring-primary/30'
              }`}
            />
            {buscandoPorNome && buscaNomeAberta && (
              <Loader2 size={14} className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            )}
          </div>

          {buscaNomeAberta && !somenteLeituraCampos && termoBuscaNome.trim().length >= 2 && (
            <div className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-md border bg-background shadow-md">
              {buscandoPorNome && (
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 size={14} className="animate-spin" /> Buscando...
                </div>
              )}
              {!buscandoPorNome && (clientesEncontradosPorNome ?? []).length === 0 && (
                <div className="px-3 py-2 text-sm text-muted-foreground">Nenhum cliente encontrado com esse nome</div>
              )}
              {!buscandoPorNome &&
                (clientesEncontradosPorNome ?? []).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelecionarClientePorNome(c.id)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                  >
                    <div className="font-medium">{c.nome}</div>
                    <div className="text-xs text-muted-foreground">
                      {[c.cpf_cnpj ? formatCpfCnpj(c.cpf_cnpj) : null, c.telefone ? formatPhone(c.telefone) : null]
                        .filter(Boolean)
                        .join(' · ') || 'Sem CPF/telefone cadastrado'}
                    </div>
                  </button>
                ))}
            </div>
          )}
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
              disabled={somenteLeituraEndereco}
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
            disabled={somenteLeituraEndereco}
            className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Número</label>
          <input
            value={value.numero}
            onChange={(e) => atualizar({ numero: e.target.value })}
            disabled={somenteLeituraEndereco}
            className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Complemento</label>
          <input
            value={value.complemento}
            onChange={(e) => atualizar({ complemento: e.target.value })}
            disabled={somenteLeituraEndereco}
            className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Bairro</label>
          <input
            value={value.bairro}
            onChange={(e) => atualizar({ bairro: e.target.value })}
            disabled={somenteLeituraEndereco}
            className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
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
