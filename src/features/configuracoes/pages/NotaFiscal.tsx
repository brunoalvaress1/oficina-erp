import { useEffect, useState } from 'react'
import { useAtualizarIntegracao, useIntegracoes } from '../hooks/useIntegracoes'
import { useImpostos } from '../hooks/useImpostos'

export function NotaFiscal() {
  const { data: integracoes, isLoading } = useIntegracoes()
  const { data: impostos } = useImpostos()
  const atualizar = useAtualizarIntegracao()

  const integracaoNfe = (integracoes ?? []).find((i) => i.codigo === 'nfe')
  const [ambiente, setAmbiente] = useState<'homologacao' | 'producao'>('homologacao')
  const [impostoPadraoId, setImpostoPadraoId] = useState('')
  const [codigoTributacaoIss, setCodigoTributacaoIss] = useState('')
  const [codigoNbs, setCodigoNbs] = useState('')
  const [codigoIndicadorOperacao, setCodigoIndicadorOperacao] = useState('')
  const [serieNfse, setSerieNfse] = useState('')
  const [serieNfe, setSerieNfe] = useState('')

  useEffect(() => {
    if (integracaoNfe) {
      const config = integracaoNfe.config as any
      setAmbiente(config?.ambiente === 'producao' ? 'producao' : 'homologacao')
      setImpostoPadraoId(config?.impostoPadraoId ?? '')
      setCodigoTributacaoIss(config?.codigoTributacaoIss ?? '')
      setCodigoNbs(config?.codigoNbs ?? '')
      setCodigoIndicadorOperacao(config?.codigoIndicadorOperacao ?? '')
      setSerieNfse(config?.serieNfse ? String(config.serieNfse) : '')
      setSerieNfe(config?.serieNfe ? String(config.serieNfe) : '')
    }
  }, [integracaoNfe])

  function salvarConfig(alteracoes: {
    ambiente?: 'homologacao' | 'producao'
    impostoPadraoId?: string
    codigoTributacaoIss?: string
    codigoNbs?: string
    codigoIndicadorOperacao?: string
    serieNfse?: string
    serieNfe?: string
  }) {
    if (!integracaoNfe) return
    const novoAmbiente = alteracoes.ambiente ?? ambiente
    const novoImpostoPadraoId = alteracoes.impostoPadraoId !== undefined ? alteracoes.impostoPadraoId : impostoPadraoId
    const novoCodigoTributacaoIss = alteracoes.codigoTributacaoIss !== undefined ? alteracoes.codigoTributacaoIss : codigoTributacaoIss
    const novoCodigoNbs = alteracoes.codigoNbs !== undefined ? alteracoes.codigoNbs : codigoNbs
    const novoCodigoIndicadorOperacao =
      alteracoes.codigoIndicadorOperacao !== undefined ? alteracoes.codigoIndicadorOperacao : codigoIndicadorOperacao
    const novoSerieNfse = alteracoes.serieNfse !== undefined ? alteracoes.serieNfse : serieNfse
    const novoSerieNfe = alteracoes.serieNfe !== undefined ? alteracoes.serieNfe : serieNfe
    if (alteracoes.ambiente !== undefined) setAmbiente(alteracoes.ambiente)
    if (alteracoes.impostoPadraoId !== undefined) setImpostoPadraoId(alteracoes.impostoPadraoId)
    if (alteracoes.codigoTributacaoIss !== undefined) setCodigoTributacaoIss(alteracoes.codigoTributacaoIss)
    if (alteracoes.codigoNbs !== undefined) setCodigoNbs(alteracoes.codigoNbs)
    if (alteracoes.codigoIndicadorOperacao !== undefined) setCodigoIndicadorOperacao(alteracoes.codigoIndicadorOperacao)
    if (alteracoes.serieNfse !== undefined) setSerieNfse(alteracoes.serieNfse)
    if (alteracoes.serieNfe !== undefined) setSerieNfe(alteracoes.serieNfe)
    atualizar.mutate({
      id: integracaoNfe.id,
      alteracoes: {
        config: {
          ambiente: novoAmbiente,
          impostoPadraoId: novoImpostoPadraoId || null,
          codigoTributacaoIss: novoCodigoTributacaoIss || null,
          codigoNbs: novoCodigoNbs || null,
          codigoIndicadorOperacao: novoCodigoIndicadorOperacao || null,
          serieNfse: novoSerieNfse ? Number(novoSerieNfse) : null,
          serieNfe: novoSerieNfe ? Number(novoSerieNfe) : null,
        },
      },
    })
  }

  function alternarAtivo() {
    if (!integracaoNfe) return
    atualizar.mutate({ id: integracaoNfe.id, alteracoes: { status: !integracaoNfe.status } })
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando...</p>

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">Nota Fiscal</h1>
        <p className="text-sm text-muted-foreground">
          Emissão de NFC-e/NF-e de <strong>peças</strong> e NFS-e de <strong>serviço</strong> (mão de obra) via Focus NFe,
          disparada a partir das vendas recebidas no Caixa.
        </p>
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-sm">Status</h2>
          <button
            type="button"
            onClick={alternarAtivo}
            disabled={!integracaoNfe || atualizar.isPending}
            className={`h-6 px-2 rounded-full text-xs font-medium border disabled:opacity-50 ${integracaoNfe?.status ? 'bg-green-500/10 text-green-600 border-green-500/30' : 'bg-muted text-muted-foreground'}`}
          >
            {integracaoNfe?.status ? 'Ativa' : 'Inativa'}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Só emite nota quando estiver Ativa. O token de acesso do Focus NFe fica configurado com segurança direto no servidor
          (Supabase Edge Function secrets) — não é editável por aqui.
        </p>
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <h2 className="font-medium text-sm">Ambiente</h2>
        <p className="text-xs text-muted-foreground">Use "Homologação" pra testar sem emitir nota de verdade na Sefaz. Só troque pra "Produção" depois de validar algumas notas de teste.</p>
        <div className="flex gap-2">
          {(['homologacao', 'producao'] as const).map((opcao) => (
            <button
              key={opcao}
              type="button"
              onClick={() => salvarConfig({ ambiente: opcao })}
              disabled={!integracaoNfe || atualizar.isPending}
              className={`h-9 px-4 rounded-md text-sm font-medium border capitalize disabled:opacity-50 ${ambiente === opcao ? 'bg-primary text-primary-foreground border-primary' : 'bg-background'}`}
            >
              {opcao}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <h2 className="font-medium text-sm">Imposto Padrão</h2>
        <p className="text-xs text-muted-foreground">
          Usado na nota sempre que o produto vendido não tiver um imposto específico configurado em Produtos. Evita ter que
          configurar item por item — cadastre um imposto genérico aqui uma vez e a emissão já funciona pra qualquer produto.
          Produtos com imposto próprio continuam usando o deles, não o padrão.
        </p>
        <select
          value={impostoPadraoId}
          onChange={(e) => salvarConfig({ impostoPadraoId: e.target.value })}
          disabled={!integracaoNfe || atualizar.isPending}
          className="w-full h-9 rounded-md border bg-background px-3 text-sm disabled:opacity-50"
        >
          <option value="">Nenhum (bloqueia a emissão de produtos sem imposto próprio)</option>
          {(impostos ?? []).map((imposto) => (
            <option key={imposto.id} value={imposto.id}>{imposto.nome}</option>
          ))}
        </select>
        {(impostos ?? []).length === 0 && (
          <p className="text-xs text-amber-600">Nenhum imposto cadastrado ainda — crie um em Configurações → Impostos primeiro.</p>
        )}
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <h2 className="font-medium text-sm">NFS-e — Código de Tributação do ISS</h2>
        <p className="text-xs text-muted-foreground">
          Código nacional de tributação do ISS usado ao emitir NFS-e de serviço (mão de obra). Baseado no item "14.01 —
          Manutenção e conservação de veículos" da lista de serviços da LC 116 — confirme com o contador se esse é o código
          correto pro seu município antes de emitir em produção, e troque aqui se precisar. Se deixar em branco, usa
          "140101" como padrão.
        </p>
        <input
          type="text"
          value={codigoTributacaoIss}
          onChange={(e) => setCodigoTributacaoIss(e.target.value)}
          onBlur={() => salvarConfig({ codigoTributacaoIss })}
          disabled={!integracaoNfe || atualizar.isPending}
          placeholder="140101"
          className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
        />
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <h2 className="font-medium text-sm">NFS-e — Código NBS do Serviço</h2>
        <p className="text-xs text-muted-foreground">
          Código da Nomenclatura Brasileira de Serviços (NBS), obrigatório sempre que a nota tiver informação de IBS/CBS
          (Reforma Tributária). Padrão usado: "120013110" — Serviços de manutenção e reparação de veículos rodoviários
          motorizados (conferido na planilha oficial de correlação do governo pro item 14.01 da LC 116), que cobre a mão de
          obra de uma oficina mecânica comum. Troque aqui se seu contador indicar outro código.
        </p>
        <input
          type="text"
          value={codigoNbs}
          onChange={(e) => setCodigoNbs(e.target.value)}
          onBlur={() => salvarConfig({ codigoNbs })}
          disabled={!integracaoNfe || atualizar.isPending}
          placeholder="120013110"
          className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
        />
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <h2 className="font-medium text-sm">NFS-e — Código Indicador de Operação (cIndOp)</h2>
        <p className="text-xs text-muted-foreground">
          Classifica o tipo de operação do serviço (oneroso ou não, vinculado ao exterior ou não). Padrão usado: "050101" —
          prestação de serviço onerosa, sem vínculo com o exterior, correspondente ao código NBS acima na mesma planilha
          oficial. Só troque se mudar o código NBS acima para outro que exija um cIndOp diferente.
        </p>
        <input
          type="text"
          value={codigoIndicadorOperacao}
          onChange={(e) => setCodigoIndicadorOperacao(e.target.value)}
          onBlur={() => salvarConfig({ codigoIndicadorOperacao })}
          disabled={!integracaoNfe || atualizar.isPending}
          placeholder="050101"
          className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
        />
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <h2 className="font-medium text-sm">NFS-e — Série da DPS</h2>
        <p className="text-xs text-muted-foreground">
          Número/série da NFS-e é o próprio sistema que escolhe (a Focus não numera sozinha aqui) — se a oficina já emitiu
          NFS-e por outro sistema/prestador antes desse (mesmo município e CNPJ), a série 1 pode colidir com um número já
          usado historicamente ("Conjunto de Série, Número... já existe"). Troque pra uma série nova (ex: 2) se isso
          acontecer. Em branco usa "1" como padrão.
        </p>
        <input
          type="number"
          min={1}
          value={serieNfse}
          onChange={(e) => setSerieNfse(e.target.value)}
          onBlur={() => salvarConfig({ serieNfse })}
          disabled={!integracaoNfe || atualizar.isPending}
          placeholder="1"
          className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
        />
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <h2 className="font-medium text-sm">NF-e (Peças) — Série Manual</h2>
        <p className="text-xs text-muted-foreground">
          Por padrão a própria Focus numera a NF-e automaticamente (deixe em branco pra manter assim). Só preencha se a
          oficina já tem NF-e emitida por outro sistema/prestador antes desse (mesmo CNPJ), porque aí o número que a Focus
          escolhe sozinha pode colidir com um já usado historicamente ("Duplicidade de NF-e com diferença na Chave de
          Acesso"). Preenchendo aqui, o próprio sistema passa a controlar a numeração, numa série nova que não tem esse
          histórico.
        </p>
        <input
          type="number"
          min={1}
          value={serieNfe}
          onChange={(e) => setSerieNfe(e.target.value)}
          onBlur={() => salvarConfig({ serieNfe })}
          disabled={!integracaoNfe || atualizar.isPending}
          placeholder="Automático (Focus numera)"
          className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
        />
      </div>
    </div>
  )
}
