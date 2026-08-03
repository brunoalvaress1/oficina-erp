import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Printer, MessageCircle } from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'
import { useFuncionariosSelect } from '@/features/estoque/hooks/useFuncionariosSelect'
import { useVeiculoDetalhe } from '@/features/veiculos/hooks/useVeiculoDetalhe'
import { buscarVeiculoPorPlaca, criarVeiculo } from '@/features/veiculos/services/veiculoService'
import { abrirWhatsApp, montarMensagemOrdemPronta } from '@/utils/whatsapp'
import { useDadosOficina } from '@/features/configuracoes/hooks/useOficina'
import { atualizarCliente, buscarClientePorId, criarCliente } from '@/features/clientes/services/clienteService'
import { useClienteDetalhe } from '@/features/clientes/hooks/useClienteDetalhe'

import { useOrdemDetalhe } from '../hooks/useOrdemDetalhe'
import {
  useAtualizarCabecalhoOrdem,
  useCancelarOrdemServico,
  useCriarOrdemServico,
  useFinalizarOrdemServico,
  useReabrirOrdemServico,
} from '../hooks/useOrdemMutations'
import {
  useAdicionarItemOrdem,
  useAprovarItemOrdem,
  useAtualizarItemOrdem,
  useRemoverItemOrdem,
} from '../hooks/useOrdemItemMutations'
import type { AlteracoesItem } from '../components/ItensOrdemSection'
import { VeiculoBlock } from '../components/VeiculoBlock'
import { ClienteBlock } from '../components/ClienteBlock'
import { ItensOrdemSection } from '../components/ItensOrdemSection'
import { ResumoFinanceiro } from '../components/ResumoFinanceiro'
import { AprovacaoItens } from '../components/AprovacaoItens'
import { HistoricoOrdem } from '../components/HistoricoOrdem'
import { PermissionGate } from '../components/PermissionGate'
import { itemFormParaExibicao, itemFormParaInput, type ItemOrdemForm } from '../types/itemOrdemForm'
import { ROTULO_STATUS_ORDEM, type StatusOrdemServico } from '../types/ordemServico'
import {
  clienteBlockValueDoExistente,
  clienteBlockValueParaInput,
  clienteBlockValueValido,
  clienteBlockValueVazio,
  veiculoBlockValueDoExistente,
  veiculoBlockValueParaInput,
  veiculoBlockValueValido,
  veiculoBlockValueVazio,
  type ClienteBlockValue,
  type VeiculoBlockValue,
} from '../types/veiculoClienteForm'

function hoje(): string {
  return new Date().toISOString().slice(0, 10)
}

export function OrdemForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const modoCriacao = !id
  const { data: oficina } = useDadosOficina()
  const { funcionario, hasPermission } = usePermissions()
  const podeVerLucro = hasPermission('ordens.visualizar_lucro')
  const podeEditar = hasPermission('ordens.editar')

  const { data: detalhe, isLoading: carregandoDetalhe } = useOrdemDetalhe(id)
  const { data: veiculoDaOrdem } = useVeiculoDetalhe(detalhe?.ordem.veiculoId)
  const { data: clienteDaOrdem } = useClienteDetalhe(detalhe?.ordem.clienteId)
  const { data: funcionarios = [] } = useFuncionariosSelect()

  const [veiculoBlockValue, setVeiculoBlockValue] = useState<VeiculoBlockValue>(veiculoBlockValueVazio)
  const [clienteBlockValue, setClienteBlockValue] = useState<ClienteBlockValue>(clienteBlockValueVazio)
  const [responsavelId, setResponsavelId] = useState('')
  const [mecanicoId, setMecanicoId] = useState('')
  const [numeroPrisma, setNumeroPrisma] = useState('')
  const [dataAbertura] = useState(hoje())
  const [dataEntrada, setDataEntrada] = useState(hoje())
  const [kmAtual, setKmAtual] = useState('')
  const [defeitosRelatados, setDefeitosRelatados] = useState('')
  const [observacoesInternas, setObservacoesInternas] = useState('')
  const [tentouSalvar, setTentouSalvar] = useState(false)
  const [itensLocais, setItensLocais] = useState<ItemOrdemForm[]>([])
  const [confirmouKmMenor, setConfirmouKmMenor] = useState(false)
  const [salvandoOrquestrado, setSalvandoOrquestrado] = useState(false)
  const [buscandoVeiculo, setBuscandoVeiculo] = useState(false)

  useEffect(() => {
    if (funcionario && !responsavelId) setResponsavelId(funcionario.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [funcionario])

  useEffect(() => {
    if (!detalhe) return
    setResponsavelId(detalhe.ordem.responsavelId)
    setMecanicoId(detalhe.ordem.mecanicoId ?? '')
    setNumeroPrisma(detalhe.ordem.numeroPrisma ?? '')
    setDataEntrada(detalhe.ordem.dataEntrada)
    setKmAtual(String(detalhe.ordem.kmAtual))
    setDefeitosRelatados(detalhe.ordem.defeitosRelatados ?? '')
    setObservacoesInternas(detalhe.ordem.observacoesInternas ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detalhe?.ordem.id])

  useEffect(() => {
    if (veiculoDaOrdem) setVeiculoBlockValue(veiculoBlockValueDoExistente(veiculoDaOrdem))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [veiculoDaOrdem?.id])

  useEffect(() => {
    if (clienteDaOrdem) setClienteBlockValue(clienteBlockValueDoExistente(clienteDaOrdem))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteDaOrdem?.id])

  const criarMutation = useCriarOrdemServico()
  const atualizarCabecalhoMutation = useAtualizarCabecalhoOrdem(id ?? '')
  const finalizarMutation = useFinalizarOrdemServico(id ?? '')
  const reabrirMutation = useReabrirOrdemServico(id ?? '')
  const cancelarMutation = useCancelarOrdemServico(id ?? '')
  const adicionarItemMutation = useAdicionarItemOrdem(id ?? '')
  const atualizarItemMutation = useAtualizarItemOrdem(id ?? '')
  const removerItemMutation = useRemoverItemOrdem(id ?? '')
  const aprovarItemMutation = useAprovarItemOrdem(id ?? '')

  const ordem = detalhe?.ordem
  const itensServidor = detalhe?.itens ?? []
  const somenteLeitura = !modoCriacao && (ordem?.status === 'enviada_caixa' || ordem?.status === 'paga' || ordem?.status === 'cancelada' || !podeEditar)

  const kmAnterior = modoCriacao ? (veiculoBlockValue.veiculoExistente?.kmAtual ?? null) : (ordem?.kmAnterior ?? null)
  const kmMenorQueAnterior = kmAnterior != null && kmAtual.trim() !== '' && Number(kmAtual) < kmAnterior

  const itensExibicao = modoCriacao
    ? itensLocais.map(itemFormParaExibicao)
    : itensServidor.map((item) => ({
        chave: item.id,
        tipo: item.tipo,
        descricao: item.descricao,
        quantidade: item.quantidade,
        valorUnitario: item.valorUnitario,
        valorDesconto: item.valorDesconto,
        valorTotal: item.valorTotal,
        valorCusto: item.valorCusto,
        fornecedorNome: item.fornecedorNome,
        numeroNota: item.numeroNota,
        statusAprovacao: item.statusAprovacao,
      }))

  const valorProdutos = itensExibicao
    .filter((i) => i.tipo === 'produto_estoque' || i.tipo === 'produto_terceirizado')
    .reduce((soma, i) => soma + i.valorTotal, 0)
  const valorServicos = itensExibicao.filter((i) => i.tipo === 'servico').reduce((soma, i) => soma + i.valorTotal, 0)
  const valorDesconto = itensExibicao.reduce((soma, i) => soma + i.valorDesconto, 0)
  const valorTotal = itensExibicao.reduce((soma, i) => soma + i.valorTotal, 0)
  // Serviço é só mão de obra: o valor inteiro é lucro. Produto (estoque ou
  // terceirizado) tem custo de peça, então o lucro é valor cobrado - custo da peça.
  const lucroEstimado = itensExibicao.reduce((soma, i) => {
    if (i.tipo === 'servico') return soma + i.valorTotal
    if (i.valorCusto != null) return soma + (i.valorTotal - i.valorCusto * i.quantidade)
    return soma
  }, 0)

  const cabecalhoValido = Boolean(
    veiculoBlockValueValido(veiculoBlockValue) &&
      clienteBlockValueValido(clienteBlockValue) &&
      responsavelId &&
      dataAbertura &&
      dataEntrada &&
      kmAtual.trim(),
  )

  function handleAdicionarItemLocal(item: ItemOrdemForm) {
    if (modoCriacao) {
      setItensLocais((prev) => [...prev, item])
    } else {
      adicionarItemMutation.mutate(itemFormParaInput(item))
    }
  }

  function handleRemoverItem(chave: string) {
    if (modoCriacao) {
      setItensLocais((prev) => prev.filter((i) => i.chave !== chave))
    } else {
      if (confirm('Remover este item da ordem?')) removerItemMutation.mutate(chave)
    }
  }

  function handleEditarItem(chave: string, alteracoes: AlteracoesItem) {
    if (modoCriacao) {
      setItensLocais((prev) =>
        prev.map((i) =>
          i.chave === chave
            ? {
                ...i,
                quantidade: String(alteracoes.quantidade),
                valorUnitario: String(alteracoes.valorUnitario),
                valorDesconto: String(alteracoes.valorDesconto),
              }
            : i,
        ),
      )
    } else {
      atualizarItemMutation.mutate({ itemId: chave, alteracoes })
    }
  }

  async function handleVeiculoBlockChange(valor: VeiculoBlockValue) {
    setVeiculoBlockValue(valor)

    // Veículo já cadastrado e vinculado a um cliente: puxa o dono automaticamente.
    const clienteIdDoVeiculo = valor.veiculoExistente?.clienteId
    if (!clienteIdDoVeiculo || clienteBlockValue.clienteExistente?.id === clienteIdDoVeiculo) return

    const cliente = await buscarClientePorId(clienteIdDoVeiculo)
    setClienteBlockValue(clienteBlockValueDoExistente(cliente))
  }

  async function handleSalvarNova() {
    setTentouSalvar(true)
    if (!cabecalhoValido) return
    if (kmMenorQueAnterior && !confirmouKmMenor) {
      const confirmar = confirm(
        `A quilometragem informada (${kmAtual}) é menor que a última registrada (${kmAnterior}). Deseja continuar mesmo assim?`,
      )
      if (!confirmar) return
      setConfirmouKmMenor(true)
    }

    setSalvandoOrquestrado(true)
    try {
      const clienteExistente = clienteBlockValue.clienteExistente
      let clienteId: string
      if (!clienteExistente) {
        const novoCliente = await criarCliente(clienteBlockValueParaInput(clienteBlockValue), funcionario!.oficinaId)
        clienteId = novoCliente.id
      } else {
        clienteId = clienteExistente.id
        const dadosMudaram =
          clienteBlockValue.telefone !== (clienteExistente.telefone ?? '') ||
          clienteBlockValue.email !== (clienteExistente.email ?? '') ||
          clienteBlockValue.cep !== (clienteExistente.cep ?? '') ||
          clienteBlockValue.endereco !== (clienteExistente.endereco ?? '') ||
          clienteBlockValue.numero !== (clienteExistente.numero ?? '') ||
          clienteBlockValue.bairro !== (clienteExistente.bairro ?? '') ||
          clienteBlockValue.cidade !== (clienteExistente.cidade ?? '') ||
          clienteBlockValue.estado !== (clienteExistente.estado ?? '') ||
          clienteBlockValue.codigoCidade !== (clienteExistente.codigoCidade ?? '')
        if (dadosMudaram) {
          // Telefone/e-mail/endereço podem ser trocados ou completados na
          // própria OS mesmo pra cliente já cadastrado (muitos clientes
          // antigos foram importados sem endereço completo).
          await atualizarCliente(clienteId, clienteBlockValueParaInput(clienteBlockValue))
        }
      }

      let veiculoId = veiculoBlockValue.veiculoExistente?.id
      if (!veiculoId) {
        try {
          const novoVeiculo = await criarVeiculo(veiculoBlockValueParaInput(veiculoBlockValue, clienteId), funcionario!.oficinaId)
          veiculoId = novoVeiculo.id
        } catch (error) {
          // Corrida rara (ex: placa acabou de ser cadastrada em outra aba/por
          // outra pessoa entre a busca automática e o clique em Salvar) — em
          // vez de travar com o erro de chave duplicada do banco, busca o
          // veículo que já existe e usa ele.
          const mensagem = error instanceof Error ? error.message : String(error)
          if (!mensagem.includes('idx_veiculos_placa_oficina')) throw error
          const veiculoJaExistente = await buscarVeiculoPorPlaca(veiculoBlockValue.placa)
          if (!veiculoJaExistente) throw error
          veiculoId = veiculoJaExistente.id
        }
      }

      criarMutation.mutate(
        {
          clienteId,
          veiculoId,
          responsavelId,
          mecanicoId: mecanicoId || undefined,
          numeroPrisma: numeroPrisma || undefined,
          dataAbertura,
          dataEntrada,
          kmAtual: Number(kmAtual),
          defeitosRelatados: defeitosRelatados || undefined,
          observacoesInternas: observacoesInternas || undefined,
          itens: itensLocais.map(itemFormParaInput),
        },
        {
          onSuccess: (resultado) => navigate(`/ordens/${resultado.id}`),
        },
      )
    } catch (error) {
      toast.error('Erro ao salvar cliente/veículo', {
        description: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setSalvandoOrquestrado(false)
    }
  }

  function handleSalvarCabecalho() {
    atualizarCabecalhoMutation.mutate({
      numeroPrisma: numeroPrisma || undefined,
      mecanicoId: mecanicoId || undefined,
      kmAtual: kmAtual ? Number(kmAtual) : undefined,
      defeitosRelatados: defeitosRelatados || undefined,
      observacoesInternas: observacoesInternas || undefined,
      dataEntrada,
    })
  }

  function handleMudarStatus(novoStatus: StatusOrdemServico) {
    atualizarCabecalhoMutation.mutate({ status: novoStatus })
  }

  function handleFinalizar() {
    if (itensServidor.length === 0) {
      toast.error('Adicione ao menos um produto ou serviço antes de finalizar.')
      return
    }
    if (confirm(`Finalizar a OS nº ${ordem?.numero} e enviar ao caixa?`)) {
      finalizarMutation.mutate()
    }
  }

  function handleReabrir() {
    if (confirm('Reabrir esta ordem? Ela sairá do caixa e voltará para Em Execução.')) {
      reabrirMutation.mutate()
    }
  }

  function handleCancelar() {
    if (confirm('Cancelar esta ordem de serviço? Essa ação fica registrada no histórico.')) {
      cancelarMutation.mutate()
    }
  }

  async function handleImprimir(modo: 'os' | 'defeitos' | 'aprovacao' | 'orcamento') {
    if (!ordem) return
    const { gerarEAbrirPdfOrdem } = await import('../components/DocumentoOrdemPdf')
    await gerarEAbrirPdfOrdem(ordem, itensServidor, modo, {
      nome: oficina?.nomeImpressao || oficina?.nomeFantasia,
      logoUrl: oficina?.logoUrl,
      rodape: oficina?.rodapeImpressao,
    })
  }

  async function handleWhatsApp() {
    if (!ordem) return
    const cliente = await buscarClientePorId(ordem.clienteId)
    if (!cliente.telefone) {
      toast.error('Cliente sem telefone cadastrado')
      return
    }
    abrirWhatsApp(
      cliente.telefone,
      montarMensagemOrdemPronta(cliente.nome, ordem.numero, ordem.valorTotal, oficina?.mensagemWhatsappPadrao, oficina?.nomeFantasia),
    )
  }

  if (!modoCriacao && carregandoDetalhe) {
    return <p className="text-sm text-muted-foreground">Carregando ordem de serviço...</p>
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {modoCriacao ? 'Nova Ordem de Serviço' : `Ordem de Serviço nº ${ordem?.numero}`}
        </h1>
        <div className="flex items-center gap-2">
          {!modoCriacao && ordem && (
            <>
              <button onClick={() => handleImprimir('os')} className="h-9 px-3 rounded-md border text-sm flex items-center gap-1">
                <Printer size={14} /> Imprimir OS
              </button>
              <button onClick={handleWhatsApp} className="h-9 px-3 rounded-md border text-sm flex items-center gap-1">
                <MessageCircle size={14} /> WhatsApp
              </button>
            </>
          )}
          <button type="button" onClick={() => navigate('/ordens')} className="h-9 px-4 rounded-md border text-sm font-medium">
            Voltar
          </button>
        </div>
      </div>

      {!modoCriacao && ordem && (
        <div className="rounded-lg border p-3 flex items-center justify-between bg-muted/20">
          <span className="text-sm">
            Status atual: <span className="font-medium">{ROTULO_STATUS_ORDEM[ordem.status]}</span>
          </span>
          <div className="flex gap-2">
            {!somenteLeitura && (
              <select
                value={ordem.status}
                onChange={(e) => handleMudarStatus(e.target.value as StatusOrdemServico)}
                className="h-8 px-2 rounded-md border bg-background text-sm"
              >
                {(Object.keys(ROTULO_STATUS_ORDEM) as StatusOrdemServico[])
                  .filter((s) => s !== 'enviada_caixa' && s !== 'paga')
                  .map((s) => (
                    <option key={s} value={s}>
                      {ROTULO_STATUS_ORDEM[s]}
                    </option>
                  ))}
              </select>
            )}
            {(ordem.status === 'enviada_caixa' || ordem.status === 'finalizada' || ordem.status === 'paga') && (
              <PermissionGate codigo="ordens.reabrir">
                <button onClick={handleReabrir} className="h-8 px-3 rounded-md border text-sm">
                  Reabrir OS
                </button>
              </PermissionGate>
            )}
            {!somenteLeitura && (
              <PermissionGate codigo="ordens.excluir">
                <button onClick={handleCancelar} className="h-8 px-3 rounded-md border border-destructive text-destructive text-sm">
                  Cancelar OS
                </button>
              </PermissionGate>
            )}
          </div>
        </div>
      )}

      <div className="rounded-lg border p-4 space-y-4">
        <h2 className="font-medium">Informações Gerais</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Responsável pela Ordem *</label>
            <select
              value={responsavelId}
              onChange={(e) => setResponsavelId(e.target.value)}
              disabled={somenteLeitura}
              className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
            >
              <option value="">Selecione</option>
              {funcionarios.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </select>
            {tentouSalvar && !responsavelId && <p className="text-xs text-destructive">Obrigatório</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Mecânico Responsável</label>
            <select
              value={mecanicoId}
              onChange={(e) => setMecanicoId(e.target.value)}
              disabled={somenteLeitura}
              className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
            >
              <option value="">Nenhum</option>
              {funcionarios.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Número Prisma</label>
            <input
              value={numeroPrisma}
              onChange={(e) => setNumeroPrisma(e.target.value)}
              disabled={somenteLeitura}
              className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Data de Entrada *</label>
            <input
              type="date"
              value={dataEntrada}
              onChange={(e) => setDataEntrada(e.target.value)}
              disabled={somenteLeitura}
              className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-medium">Defeitos Relatados</label>
            <textarea
              value={defeitosRelatados}
              onChange={(e) => setDefeitosRelatados(e.target.value)}
              disabled={somenteLeitura}
              rows={2}
              className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-medium">Observações Internas</label>
            <textarea
              value={observacoesInternas}
              onChange={(e) => setObservacoesInternas(e.target.value)}
              disabled={somenteLeitura}
              rows={2}
              className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
            />
          </div>
        </div>

        {!modoCriacao && !somenteLeitura && (
          <div className="flex justify-end">
            <button
              onClick={handleSalvarCabecalho}
              disabled={atualizarCabecalhoMutation.isPending}
              className="h-8 px-3 rounded-md border text-sm"
            >
              {atualizarCabecalhoMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        )}
      </div>

      <VeiculoBlock
        value={veiculoBlockValue}
        onChange={handleVeiculoBlockChange}
        kmAtual={kmAtual}
        onChangeKmAtual={setKmAtual}
        kmAnterior={kmAnterior}
        tentouSalvar={tentouSalvar}
        disabled={!modoCriacao || somenteLeitura}
        onBuscandoChange={setBuscandoVeiculo}
      />

      <ClienteBlock
        value={clienteBlockValue}
        onChange={setClienteBlockValue}
        tentouSalvar={tentouSalvar}
        disabled={!modoCriacao || somenteLeitura}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <ItensOrdemSection
            itens={itensExibicao}
            podeVerLucro={podeVerLucro}
            somenteLeitura={somenteLeitura}
            onAdicionar={handleAdicionarItemLocal}
            onEditar={handleEditarItem}
            onRemover={handleRemoverItem}
            adicionando={adicionarItemMutation.isPending}
            editando={atualizarItemMutation.isPending}
          />
        </div>
        <div>
          <ResumoFinanceiro
            valorProdutos={valorProdutos}
            valorServicos={valorServicos}
            valorDesconto={valorDesconto}
            valorTotal={valorTotal}
            lucroEstimado={lucroEstimado}
            podeVerLucro={podeVerLucro}
          />
        </div>
      </div>

      {!modoCriacao && (
        <PermissionGate codigo="ordens.aprovar_itens">
          <AprovacaoItens
            itens={itensServidor}
            onAprovar={(itemId) => aprovarItemMutation.mutate({ itemId, status: 'aprovado' })}
            onRecusar={(itemId) => aprovarItemMutation.mutate({ itemId, status: 'recusado' })}
            onAprovarTodos={() => {
              for (const item of itensServidor) {
                if (item.statusAprovacao === 'aguardando') {
                  aprovarItemMutation.mutate({ itemId: item.id, status: 'aprovado' })
                }
              }
            }}
            processando={aprovarItemMutation.isPending}
          />
        </PermissionGate>
      )}

      {!modoCriacao && detalhe && <HistoricoOrdem historico={detalhe.historico} />}

      {modoCriacao && (
        <div className="rounded-lg border p-4">
          {tentouSalvar && !cabecalhoValido && (
            <p className="text-sm text-destructive mb-3">Preencha veículo, responsável, datas e quilometragem antes de salvar.</p>
          )}
          <button
            type="button"
            onClick={handleSalvarNova}
            disabled={criarMutation.isPending || salvandoOrquestrado || buscandoVeiculo}
            className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
          >
            {buscandoVeiculo
              ? 'Verificando placa...'
              : criarMutation.isPending || salvandoOrquestrado
                ? 'Salvando...'
                : 'Salvar Ordem de Serviço'}
          </button>
        </div>
      )}

      {!modoCriacao && !somenteLeitura && (
        <PermissionGate codigo="ordens.finalizar">
          <div className="rounded-lg border p-4">
            <button
              type="button"
              onClick={handleFinalizar}
              disabled={finalizarMutation.isPending}
              className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
            >
              {finalizarMutation.isPending ? 'Finalizando...' : 'Finalizar Ordem'}
            </button>
          </div>
        </PermissionGate>
      )}
    </div>
  )
}
