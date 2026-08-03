import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import {
  ChevronDown,
  Eye,
  Pencil,
  Printer,
  MessageCircle,
  FileWarning,
  CheckCircle2,
  RotateCcw,
  Ban,
  Wrench,
  DollarSign,
  Receipt,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, formatDate } from '@/utils/format'
import { abrirWhatsApp, montarMensagemOrdemPronta } from '@/utils/whatsapp'
import { useDadosOficina } from '@/features/configuracoes/hooks/useOficina'
import { useCaixaLancamentoIdPorOrdem } from '@/features/caixa/hooks/useCaixaLancamentoDetalhe'
import { EmitirNotaFiscalModal } from '@/features/notasFiscaisSaida/components/EmitirNotaFiscalModal'
import { useNotasFiscaisPorLancamento } from '@/features/notasFiscaisSaida/hooks/useNotasFiscaisSaida'
import { buscarOrdemDetalhe } from '../services/ordemServicoService'
import { buscarClientePorId } from '@/features/clientes/services/clienteService'
import type { ModoDocumentoOrdem } from './DocumentoOrdemPdf'
import { useAtualizarCabecalhoOrdem, useFinalizarOrdemServico, useReabrirOrdemServico } from '../hooks/useOrdemMutations'
import { PermissionGate } from './PermissionGate'
import { ROTULO_STATUS_ORDEM, type OrdemServico } from '../types/ordemServico'

const COR_STATUS: Record<string, string> = {
  em_aberto: 'bg-blue-100 text-blue-700',
  em_execucao: 'bg-indigo-100 text-indigo-700',
  aguardando_aprovacao: 'bg-amber-100 text-amber-700',
  aguardando_pecas: 'bg-orange-100 text-orange-700',
  finalizada: 'bg-teal-100 text-teal-700',
  enviada_caixa: 'bg-green-100 text-green-700',
  paga: 'bg-emerald-100 text-emerald-700',
  cancelada: 'bg-red-100 text-red-700',
}

interface OrdemCardProps {
  ordem: OrdemServico
  semaforo?: 'verde' | 'amarelo' | 'vermelho'
}

export function OrdemCard({ ordem, semaforo }: OrdemCardProps) {
  const navigate = useNavigate()
  const { data: oficina } = useDadosOficina()
  const [menuAberto, setMenuAberto] = useState(false)
  const [posicaoMenu, setPosicaoMenu] = useState<{ top?: number; bottom?: number; left: number; maxAltura: number } | null>(null)
  const [modalNotaFiscalAberto, setModalNotaFiscalAberto] = useState(false)
  const botaoRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const reabrirMutation = useReabrirOrdemServico(ordem.id)
  const finalizarMutation = useFinalizarOrdemServico(ordem.id)
  const atualizarCabecalhoMutation = useAtualizarCabecalhoOrdem(ordem.id)
  const { data: caixaLancamentoId } = useCaixaLancamentoIdPorOrdem(ordem.status === 'paga' ? ordem.id : undefined)
  const { data: notasFiscais } = useNotasFiscaisPorLancamento(ordem.status === 'paga' ? (caixaLancamentoId ?? undefined) : undefined)

  const imprimirMutation = useMutation({
    mutationFn: async (modo: ModoDocumentoOrdem) => {
      const [detalhe, { gerarEAbrirPdfOrdem }] = await Promise.all([
        buscarOrdemDetalhe(ordem.id),
        import('./DocumentoOrdemPdf'),
      ])
      await gerarEAbrirPdfOrdem(detalhe.ordem, detalhe.itens, modo, {
        nome: oficina?.nomeImpressao || oficina?.nomeFantasia,
        logoUrl: oficina?.logoUrl,
        rodape: oficina?.rodapeImpressao,
      })
    },
    onError: (error: Error) => toast.error('Erro ao gerar PDF', { description: error.message }),
  })

  // O dropdown vive fora da tabela (via portal) porque a lista de OS fica dentro de
  // um container com overflow-hidden (pros cantos arredondados) — sem isso o menu
  // era cortado/escondido ao abrir, principalmente nas linhas mais pra baixo.
  function abrirMenu() {
    const rect = botaoRef.current?.getBoundingClientRect()
    if (rect) {
      const larguraMenu = 224
      setPosicaoMenu({
        top: rect.bottom + 4,
        left: Math.min(rect.left, window.innerWidth - larguraMenu - 8),
        maxAltura: window.innerHeight - rect.bottom - 8,
      })
    }
    setMenuAberto(true)
  }

  // Depois que o menu renderiza (já sabemos a altura real dele, que varia
  // conforme quantas opções aparecem pra essa OS), corrige pra abrir pra cima
  // se não sobrar espaço embaixo — com muitas OS na lista, uma linha perto do
  // fim da tela abria o menu pra baixo e ele saía/ficava inacessível. O
  // maxAltura garante rolagem interna em vez de vazar pro outro lado da tela
  // quando nem embaixo nem em cima cabe tudo de uma vez.
  useLayoutEffect(() => {
    if (!menuAberto || !menuRef.current || !botaoRef.current) return
    const alturaMenu = menuRef.current.getBoundingClientRect().height
    const botaoRect = botaoRef.current.getBoundingClientRect()
    const espacoAbaixo = window.innerHeight - botaoRect.bottom - 8
    const espacoAcima = botaoRect.top - 8
    const precisaAbrirParaCima = alturaMenu > espacoAbaixo
    setPosicaoMenu((atual) => {
      if (!atual) return atual
      const jaEstaCorreto = precisaAbrirParaCima ? atual.bottom !== undefined : atual.top !== undefined
      if (jaEstaCorreto) return atual
      const larguraMenu = 224
      return {
        left: Math.min(botaoRect.left, window.innerWidth - larguraMenu - 8),
        top: precisaAbrirParaCima ? undefined : botaoRect.bottom + 4,
        bottom: precisaAbrirParaCima ? window.innerHeight - botaoRect.top + 4 : undefined,
        maxAltura: precisaAbrirParaCima ? espacoAcima : espacoAbaixo,
      }
    })
  }, [menuAberto])

  useEffect(() => {
    if (!menuAberto) return

    function handleClickFora(event: MouseEvent) {
      const alvo = event.target as Node
      if (menuRef.current?.contains(alvo) || botaoRef.current?.contains(alvo)) return
      setMenuAberto(false)
    }
    // Scroll é ouvido com capture:true pra pegar rolagem da página/tabela por
    // trás do menu — mas isso também captura a rolagem DENTRO do próprio menu
    // (quando ele tem mais itens do que cabe e vira scrollável), fechando o
    // menu assim que o usuário tentava rolar seu conteúdo. Ignora o evento
    // quando ele se origina de dentro do próprio menu.
    function handleFechar(event: Event) {
      if (menuRef.current?.contains(event.target as Node)) return
      setMenuAberto(false)
    }

    document.addEventListener('mousedown', handleClickFora)
    window.addEventListener('scroll', handleFechar, true)
    window.addEventListener('resize', handleFechar)
    return () => {
      document.removeEventListener('mousedown', handleClickFora)
      window.removeEventListener('scroll', handleFechar, true)
      window.removeEventListener('resize', handleFechar)
    }
  }, [menuAberto])

  function handleWhatsApp() {
    if (!ordem.clienteNome) return
    const mensagem = montarMensagemOrdemPronta(
      ordem.clienteNome,
      ordem.numero,
      ordem.valorTotal,
      oficina?.mensagemWhatsappPadrao,
      oficina?.nomeFantasia,
    )
    buscarClientePorId(ordem.clienteId).then((cliente) => {
      if (cliente.telefone) abrirWhatsApp(cliente.telefone, mensagem)
      else toast.error('Cliente sem telefone cadastrado')
    })
    setMenuAberto(false)
  }

  function handleReabrir() {
    const aviso =
      ordem.status === 'paga'
        ? `Reabrir a OS nº ${ordem.numero}? Essa OS já está PAGA — reabrir vai DESFAZER o recebimento no Caixa (o pagamento é excluído) e ela volta para "Em Execução".`
        : `Reabrir a OS nº ${ordem.numero}? Ela voltará para "Em Execução" e sairá do caixa.`
    if (confirm(aviso)) {
      reabrirMutation.mutate()
    }
    setMenuAberto(false)
  }

  function handleMoverParaExecucao() {
    atualizarCabecalhoMutation.mutate({ status: 'em_execucao' })
    setMenuAberto(false)
  }

  function handleFinalizar() {
    if (confirm(`Finalizar a OS nº ${ordem.numero} e enviar ao caixa?`)) {
      finalizarMutation.mutate()
    }
    setMenuAberto(false)
  }

  const corSemaforo = semaforo === 'vermelho' ? 'bg-red-500' : semaforo === 'amarelo' ? 'bg-amber-400' : 'bg-green-500'

  return (
    <tr className="border-t hover:bg-muted/20">
      <td className="px-3 py-2">
        <button
          ref={botaoRef}
          type="button"
          onClick={() => (menuAberto ? setMenuAberto(false) : abrirMenu())}
          className="p-1.5 rounded hover:bg-muted"
        >
          <ChevronDown size={16} className={menuAberto ? 'rotate-180 transition-transform' : 'transition-transform'} />
        </button>

        {menuAberto &&
          posicaoMenu &&
          createPortal(
            <div
              ref={menuRef}
              style={{ position: 'fixed', top: posicaoMenu.top, bottom: posicaoMenu.bottom, left: posicaoMenu.left, maxHeight: posicaoMenu.maxAltura, overflowY: 'auto' }}
              className="w-56 rounded-md border bg-background shadow-lg z-50 py-1 text-sm"
            >
              <ItemMenu icone={Eye} label="Visualizar Ordem" onClick={() => navigate(`/ordens/${ordem.id}`)} />
              <PermissionGate codigo="ordens.editar">
                <ItemMenu icone={Pencil} label="Editar Ordem" onClick={() => navigate(`/ordens/${ordem.id}`)} />
              </PermissionGate>
              <ItemMenu icone={Printer} label="Imprimir OS" onClick={() => imprimirMutation.mutate('os')} />
              <ItemMenu icone={MessageCircle} label="Enviar WhatsApp" onClick={handleWhatsApp} />
              <ItemMenu icone={FileWarning} label="Imprimir Defeito" onClick={() => imprimirMutation.mutate('defeitos')} />
              <ItemMenu icone={CheckCircle2} label="Aprovação" onClick={() => navigate(`/ordens/${ordem.id}#aprovacao`)} />
              <ItemMenu icone={Printer} label="Imprimir Orçamento" onClick={() => imprimirMutation.mutate('orcamento')} />
              {ordem.status === 'paga' && caixaLancamentoId && (
                <PermissionGate codigo="notas_fiscais.emitir">
                  <ItemMenu
                    icone={Receipt}
                    label={notasFiscais && notasFiscais.length > 0 ? 'Nota Fiscal' : 'Emitir Nota Fiscal'}
                    onClick={() => {
                      setModalNotaFiscalAberto(true)
                      setMenuAberto(false)
                    }}
                  />
                </PermissionGate>
              )}
              {ordem.status !== 'em_execucao' && ordem.status !== 'enviada_caixa' && ordem.status !== 'cancelada' && (
                <PermissionGate codigo="ordens.editar">
                  <ItemMenu icone={Wrench} label="Mover para Execução" onClick={handleMoverParaExecucao} />
                </PermissionGate>
              )}
              {ordem.status !== 'enviada_caixa' && ordem.status !== 'cancelada' && (
                <PermissionGate codigo="ordens.finalizar">
                  <ItemMenu icone={DollarSign} label="Finalizar (Enviar ao Caixa)" onClick={handleFinalizar} />
                </PermissionGate>
              )}
              {(ordem.status === 'enviada_caixa' || ordem.status === 'finalizada' || ordem.status === 'paga') && (
                <PermissionGate codigo="ordens.reabrir">
                  <ItemMenu icone={RotateCcw} label="Reabrir OS" onClick={handleReabrir} />
                </PermissionGate>
              )}
              {ordem.status !== 'cancelada' && ordem.status !== 'enviada_caixa' && (
                <PermissionGate codigo="ordens.excluir">
                  <ItemMenu
                    icone={Ban}
                    label="Cancelar OS"
                    destrutivo
                    onClick={() => navigate(`/ordens/${ordem.id}`)}
                  />
                </PermissionGate>
              )}
            </div>,
            document.body,
          )}
      </td>
      <td className="px-3 py-2 font-medium">
        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${corSemaforo}`} title="Situação de aprovação dos itens" />
        {ordem.numero}
      </td>
      <td className="px-3 py-2">{ordem.clienteNome ?? '-'}</td>
      {ordem.veiculoId ? (
        <>
          <td className="px-3 py-2">{ordem.veiculoModelo ?? '-'}</td>
          <td className="px-3 py-2">{ordem.veiculoPlaca ?? '-'}</td>
        </>
      ) : (
        <td className="px-3 py-2 text-muted-foreground italic" colSpan={2}>
          Nenhum veículo cadastrado
        </td>
      )}
      <td className="px-3 py-2">{ordem.kmAtual?.toLocaleString('pt-BR') ?? '-'}</td>
      <td className="px-3 py-2">
        <span className={`text-xs px-2 py-0.5 rounded-full ${COR_STATUS[ordem.status]}`}>
          {ROTULO_STATUS_ORDEM[ordem.status]}
        </span>
      </td>
      <td className="px-3 py-2">{ordem.mecanicoNome ?? '-'}</td>
      <td className="px-3 py-2 text-right font-medium">{formatCurrency(ordem.valorTotal)}</td>
      <td className="px-3 py-2">{formatDate(ordem.dataAbertura)}</td>

      {/* Dialog precisa ir via portal — <tr> não pode ter <div> como filho direto. */}
      {modalNotaFiscalAberto &&
        caixaLancamentoId &&
        createPortal(
          <EmitirNotaFiscalModal
            caixaLancamentoId={caixaLancamentoId}
            ordemServicoId={ordem.id}
            ordemNumero={ordem.numero}
            open={modalNotaFiscalAberto}
            onOpenChange={setModalNotaFiscalAberto}
          />,
          document.body,
        )}
    </tr>
  )
}

function ItemMenu({
  icone: Icone,
  label,
  onClick,
  destrutivo,
}: {
  icone: typeof Eye
  label: string
  onClick: () => void
  destrutivo?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-1.5 hover:bg-muted text-left ${destrutivo ? 'text-destructive' : ''}`}
    >
      <Icone size={14} /> {label}
    </button>
  )
}
