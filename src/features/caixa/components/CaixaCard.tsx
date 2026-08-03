import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { ChevronDown, DollarSign, Eye, Printer, MessageCircle, History, Ban, Receipt } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, formatDate } from '@/utils/format'
import { abrirWhatsApp, montarMensagemOrdemPronta } from '@/utils/whatsapp'
import { useDadosOficina } from '@/features/configuracoes/hooks/useOficina'
import { buscarClientePorId } from '@/features/clientes/services/clienteService'
import { buscarOrdemDetalhe } from '@/features/ordens/services/ordemServicoService'
import { EmitirNotaFiscalModal } from '@/features/notasFiscaisSaida/components/EmitirNotaFiscalModal'
import { useNotasFiscaisPorLancamento } from '@/features/notasFiscaisSaida/hooks/useNotasFiscaisSaida'
import { useCaixaLancamentoDetalhe } from '../hooks/useCaixaLancamentoDetalhe'
import { useCancelarRecebimento } from '../hooks/useCaixaMutations'
import { useSessaoCaixaAberta } from '../hooks/useCaixaSessao'
import { HistoricoLancamento } from './HistoricoLancamento'
import { PermissionGate } from './PermissionGate'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { CaixaLancamento, StatusCaixaLancamento } from '../types/caixa'

const COR_STATUS: Record<StatusCaixaLancamento, string> = {
  aguardando: 'bg-blue-100 text-blue-700',
  pendente: 'bg-amber-100 text-amber-700',
  recebido: 'bg-green-100 text-green-700',
  cancelado: 'bg-red-100 text-red-700',
}

const ROTULO_STATUS: Record<StatusCaixaLancamento, string> = {
  aguardando: 'Aguardando Pagamento',
  pendente: 'Pendente',
  recebido: 'Recebido',
  cancelado: 'Cancelado',
}

interface CaixaCardProps {
  lancamento: CaixaLancamento
  // O modal de receber pagamento é controlado pela lista (CaixaList), não
  // aqui dentro — depois de receber, esse lançamento some da lista filtrada
  // por "aguardando" e essa <tr> (com tudo que tem dentro, incluindo modais
  // via portal) seria desmontada na hora, fechando o recibo de sucesso antes
  // do usuário conseguir clicar em "Imprimir".
  onAbrirReceber: (lancamento: CaixaLancamento) => void
}

export function CaixaCard({ lancamento, onAbrirReceber }: CaixaCardProps) {
  const navigate = useNavigate()
  const { data: oficina } = useDadosOficina()
  const [menuAberto, setMenuAberto] = useState(false)
  const [posicaoMenu, setPosicaoMenu] = useState<{ top?: number; bottom?: number; left: number; maxAltura: number } | null>(null)
  const [modalHistoricoAberto, setModalHistoricoAberto] = useState(false)
  const [modalNotaFiscalAberto, setModalNotaFiscalAberto] = useState(false)
  const botaoRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const { data: sessaoAberta } = useSessaoCaixaAberta()
  const cancelarMutation = useCancelarRecebimento()
  const { data: detalhe } = useCaixaLancamentoDetalhe(modalHistoricoAberto ? lancamento.id : undefined)
  const { data: notasFiscais } = useNotasFiscaisPorLancamento(lancamento.status === 'recebido' ? lancamento.id : undefined)

  const imprimirMutation = useMutation({
    mutationFn: async () => {
      const [ordemDetalhe, { gerarEAbrirPdfOrdem }] = await Promise.all([
        buscarOrdemDetalhe(lancamento.ordemServicoId),
        import('@/features/ordens/components/DocumentoOrdemPdf'),
      ])
      await gerarEAbrirPdfOrdem(ordemDetalhe.ordem, ordemDetalhe.itens, 'os', {
        nome: oficina?.nomeImpressao || oficina?.nomeFantasia,
        logoUrl: oficina?.logoUrl,
        rodape: oficina?.rodapeImpressao,
      })
    },
    onError: (error: Error) => toast.error('Erro ao gerar PDF', { description: error.message }),
  })

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
    // quando ele vira scrollável, fechando o menu assim que o usuário tentava
    // rolar seu conteúdo. Ignora o evento quando vem de dentro do menu.
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
    if (!lancamento.clienteNome) return
    buscarClientePorId(lancamento.clienteId).then((cliente) => {
      if (!cliente.telefone) {
        toast.error('Cliente sem telefone cadastrado')
        return
      }
      abrirWhatsApp(
        cliente.telefone,
        montarMensagemOrdemPronta(cliente.nome, lancamento.ordemNumero, lancamento.valorTotal, oficina?.mensagemWhatsappPadrao, oficina?.nomeFantasia),
      )
    })
    setMenuAberto(false)
  }

  function handleCancelarRecebimento() {
    const motivo = prompt('Motivo do cancelamento do recebimento:')
    if (motivo === null) return
    if (!motivo.trim()) {
      toast.error('Informe o motivo do cancelamento')
      return
    }
    cancelarMutation.mutate({ caixaLancamentoId: lancamento.id, motivo: motivo.trim() })
    setMenuAberto(false)
  }

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
              {lancamento.status !== 'recebido' && lancamento.status !== 'cancelado' && sessaoAberta && (
                <PermissionGate codigo="caixa.receber">
                  <ItemMenu
                    icone={DollarSign}
                    label="Receber OS"
                    onClick={() => {
                      onAbrirReceber(lancamento)
                      setMenuAberto(false)
                    }}
                  />
                </PermissionGate>
              )}
              <ItemMenu icone={Printer} label="Imprimir OS" onClick={() => imprimirMutation.mutate()} />
              <ItemMenu icone={Eye} label="Visualizar OS" onClick={() => navigate(`/ordens/${lancamento.ordemServicoId}`)} />
              <ItemMenu icone={MessageCircle} label="Enviar WhatsApp" onClick={handleWhatsApp} />
              {lancamento.status === 'recebido' && (
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
              <ItemMenu
                icone={History}
                label="Histórico"
                onClick={() => {
                  setModalHistoricoAberto(true)
                  setMenuAberto(false)
                }}
              />
              {lancamento.status === 'recebido' && (
                <PermissionGate codigo="caixa.cancelar">
                  <ItemMenu icone={Ban} label="Cancelar Recebimento" destrutivo onClick={handleCancelarRecebimento} />
                </PermissionGate>
              )}
            </div>,
            document.body,
          )}
      </td>
      <td className="px-3 py-2 font-medium">OS {lancamento.ordemNumero}</td>
      <td className="px-3 py-2">{lancamento.clienteNome ?? '-'}</td>
      <td className="px-3 py-2">{lancamento.veiculoModelo ?? '-'}</td>
      <td className="px-3 py-2">{lancamento.veiculoPlaca ?? '-'}</td>
      <td className="px-3 py-2">
        <span className={`text-xs px-2 py-0.5 rounded-full ${COR_STATUS[lancamento.status]}`}>
          {ROTULO_STATUS[lancamento.status]}
        </span>
      </td>
      <td className="px-3 py-2 text-right font-medium">{formatCurrency(lancamento.valorTotal)}</td>
      <td className="px-3 py-2">{formatDate(lancamento.dataAbertura)}</td>

      {/* Dialogs precisam ir via portal — <tr> não pode ter <div> como filho direto (HTML inválido). */}
      {createPortal(
        <>
          {modalNotaFiscalAberto && (
            <EmitirNotaFiscalModal
              caixaLancamentoId={lancamento.id}
              ordemServicoId={lancamento.ordemServicoId}
              ordemNumero={lancamento.ordemNumero}
              open={modalNotaFiscalAberto}
              onOpenChange={setModalNotaFiscalAberto}
            />
          )}
          <Dialog open={modalHistoricoAberto} onOpenChange={setModalHistoricoAberto}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Histórico — OS nº {lancamento.ordemNumero}</DialogTitle>
              </DialogHeader>
              <HistoricoLancamento historico={detalhe?.historico ?? []} />
            </DialogContent>
          </Dialog>
        </>,
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
