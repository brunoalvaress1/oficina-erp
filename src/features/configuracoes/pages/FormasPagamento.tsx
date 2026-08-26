import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ROTULO_FORMA_PAGAMENTO } from '@/features/caixa/types/caixa'
import { ROTULO_GRUPO_TAXA_MAQUININHA, type GrupoTaxaMaquininha } from '@/features/caixa/types/bandeiraCartao'
import { useContasBancariasLista } from '@/features/financeiro/hooks/useContasBancariasFinanceiro'
import {
  useAtualizarConfiguracaoParcelamento,
  useAtualizarFormaPagamentoConfig,
  useAtualizarGrupoTaxaBandeira,
  useAtualizarTaxaMaquininha,
  useBandeirasCartaoConfig,
  useConfiguracaoParcelamento,
  useFormasPagamentoConfig,
  useTaxasMaquininhaConfig,
} from '../hooks/usePagamentosConfig'
import type { FormaPagamentoConfig, TaxaMaquininha } from '../types/pagamentos'

function LinhaForma({ forma }: { forma: FormaPagamentoConfig }) {
  const { data: contas } = useContasBancariasLista()
  const atualizar = useAtualizarFormaPagamentoConfig()

  const [nomeExibicao, setNomeExibicao] = useState(forma.nomeExibicao ?? '')
  const [cor, setCor] = useState(forma.cor ?? '#64748b')
  const [taxaPercentual, setTaxaPercentual] = useState(String(forma.taxaPercentual))
  const [prazoRecebimentoDias, setPrazoRecebimentoDias] = useState(String(forma.prazoRecebimentoDias))
  const [contaBancariaPadraoId, setContaBancariaPadraoId] = useState(forma.contaBancariaPadraoId ?? '')

  function salvar() {
    atualizar.mutate({
      codigo: forma.codigo,
      input: {
        nomeExibicao: nomeExibicao || ROTULO_FORMA_PAGAMENTO[forma.codigo],
        cor,
        taxaPercentual: Number(taxaPercentual) || 0,
        prazoRecebimentoDias: Number(prazoRecebimentoDias) || 0,
        contaBancariaPadraoId: contaBancariaPadraoId || null,
      },
    })
  }

  function alternarAtivo() {
    atualizar.mutate({ codigo: forma.codigo, input: { ativo: !forma.ativo } })
  }

  return (
    <div className="rounded-lg border p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full border" style={{ backgroundColor: cor }} />
          <span className="font-medium text-sm">{ROTULO_FORMA_PAGAMENTO[forma.codigo]}</span>
        </div>
        <button
          type="button"
          onClick={alternarAtivo}
          className={`h-6 px-2 rounded-full text-xs font-medium border ${forma.ativo ? 'bg-green-500/10 text-green-600 border-green-500/30' : 'bg-muted text-muted-foreground'}`}
        >
          {forma.ativo ? 'Ativo' : 'Inativo'}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Nome de exibição</label>
          <input
            value={nomeExibicao}
            onChange={(e) => setNomeExibicao(e.target.value)}
            placeholder={ROTULO_FORMA_PAGAMENTO[forma.codigo]}
            className="w-full h-8 rounded-md border bg-transparent px-2 text-sm outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Cor</label>
          <input type="color" value={cor} onChange={(e) => setCor(e.target.value)} className="w-full h-8 rounded-md border bg-transparent px-1" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Taxa (%)</label>
          <input
            type="number"
            step="0.01"
            value={taxaPercentual}
            onChange={(e) => setTaxaPercentual(e.target.value)}
            className="w-full h-8 rounded-md border bg-transparent px-2 text-sm outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Prazo recebimento (dias)</label>
          <input
            type="number"
            value={prazoRecebimentoDias}
            onChange={(e) => setPrazoRecebimentoDias(e.target.value)}
            className="w-full h-8 rounded-md border bg-transparent px-2 text-sm outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
        <div className="space-y-1 col-span-2">
          <label className="text-xs font-medium text-muted-foreground">Conta bancária padrão</label>
          <select
            value={contaBancariaPadraoId}
            onChange={(e) => setContaBancariaPadraoId(e.target.value)}
            className="w-full h-8 rounded-md border bg-background px-2 text-sm"
          >
            <option value="">Nenhuma</option>
            {(contas ?? []).map((conta) => (
              <option key={conta.id} value={conta.id}>
                {conta.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button type="button" onClick={salvar} disabled={atualizar.isPending} className="h-8 px-4 rounded-md border text-xs font-medium disabled:opacity-50">
        {atualizar.isPending ? 'Salvando...' : 'Salvar'}
      </button>
    </div>
  )
}

function SecaoParcelamento() {
  const { data: parcelamento } = useConfiguracaoParcelamento()
  const atualizar = useAtualizarConfiguracaoParcelamento()

  const [parcelasSemJuros, setParcelasSemJuros] = useState('6')
  const [jurosPercentual, setJurosPercentual] = useState('8')

  useEffect(() => {
    if (parcelamento) {
      setParcelasSemJuros(String(parcelamento.parcelasSemJuros))
      setJurosPercentual(String(parcelamento.jurosPercentual))
    }
  }, [parcelamento])

  function salvar() {
    const semJuros = Number(parcelasSemJuros)
    const juros = Number(jurosPercentual)
    if (!Number.isFinite(semJuros) || semJuros < 1 || !Number.isFinite(juros) || juros < 0) {
      toast.error('Valores inválidos')
      return
    }
    atualizar.mutate({ parcelasSemJuros: semJuros, jurosPercentual: juros })
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <h2 className="font-medium text-sm">Parcelamento no Cartão de Crédito</h2>
      <p className="text-xs text-muted-foreground">Regra aplicada automaticamente nas vendas no Caixa: até o número de parcelas abaixo, sem juros; acima disso, aplica o percentual de juros sobre o valor.</p>
      <div className="grid grid-cols-2 gap-3 max-w-sm">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Parcelas sem juros (até)</label>
          <input
            type="number"
            min={1}
            value={parcelasSemJuros}
            onChange={(e) => setParcelasSemJuros(e.target.value)}
            className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Juros acima disso (%)</label>
          <input
            type="number"
            step="0.01"
            min={0}
            value={jurosPercentual}
            onChange={(e) => setJurosPercentual(e.target.value)}
            className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
      </div>
      <button type="button" onClick={salvar} disabled={atualizar.isPending} className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
        {atualizar.isPending ? 'Salvando...' : 'Salvar regra'}
      </button>
    </div>
  )
}

function rotuloLinhaTaxa(taxa: TaxaMaquininha): string {
  return taxa.tipo === 'debito' ? 'Débito' : `Crédito ${taxa.parcelas}x`
}

function TabelaTaxaGrupo({ grupo, taxas }: { grupo: GrupoTaxaMaquininha; taxas: TaxaMaquininha[] }) {
  const atualizar = useAtualizarTaxaMaquininha()
  const [valores, setValores] = useState<Record<string, string>>({})

  useEffect(() => {
    setValores(Object.fromEntries(taxas.map((t) => [t.id, String(t.taxaPercentual)])))
  }, [taxas])

  function salvar() {
    for (const taxa of taxas) {
      const novo = Number(valores[taxa.id])
      if (Number.isFinite(novo) && novo !== taxa.taxaPercentual) {
        atualizar.mutate({ id: taxa.id, taxaPercentual: novo })
      }
    }
  }

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <h3 className="text-sm font-medium">{ROTULO_GRUPO_TAXA_MAQUININHA[grupo]}</h3>
      <div className="space-y-1">
        {taxas.map((taxa) => (
          <div key={taxa.id} className="flex items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground">{rotuloLinhaTaxa(taxa)}</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.01"
                min={0}
                value={valores[taxa.id] ?? ''}
                onChange={(e) => setValores((v) => ({ ...v, [taxa.id]: e.target.value }))}
                className="w-20 h-8 rounded-md border bg-transparent px-2 text-sm text-right outline-none focus:ring-1 focus:ring-primary/30"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={salvar}
        disabled={atualizar.isPending}
        className="h-8 px-3 rounded-md border text-xs font-medium disabled:opacity-50"
      >
        {atualizar.isPending ? 'Salvando...' : 'Salvar taxas'}
      </button>
    </div>
  )
}

function SecaoTaxaMaquininha() {
  const { data: taxas, isLoading: carregandoTaxas } = useTaxasMaquininhaConfig()
  const { data: bandeiras, isLoading: carregandoBandeiras } = useBandeirasCartaoConfig()
  const atualizarGrupoBandeira = useAtualizarGrupoTaxaBandeira()

  const taxasMastercard = (taxas ?? []).filter((t) => t.grupoTaxa === 'mastercard')
  const taxasOutros = (taxas ?? []).filter((t) => t.grupoTaxa === 'outros')

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div>
        <h2 className="font-medium text-sm">Taxa da Maquininha (custo real, por bandeira e parcela)</h2>
        <p className="text-xs text-muted-foreground">
          Diferente do juro repassado ao cliente acima — isso é o quanto a operadora de cartão realmente cobra da
          oficina, usado pra calcular a "Perda com parcelamento" no Resumo do Caixa.
        </p>
      </div>

      {!carregandoBandeiras && (bandeiras ?? []).length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Bandeiras cadastradas — grupo de taxa</p>
          <div className="flex flex-wrap gap-2">
            {(bandeiras ?? []).map((bandeira) => (
              <div key={bandeira.id} className="flex items-center gap-1 rounded-md border p-1">
                <span className="text-xs px-1.5">{bandeira.nome}</span>
                {(['mastercard', 'outros'] as const).map((grupo) => (
                  <button
                    key={grupo}
                    type="button"
                    onClick={() => atualizarGrupoBandeira.mutate({ id: bandeira.id, grupoTaxa: grupo })}
                    className={`h-6 px-2 rounded text-xs font-medium ${
                      bandeira.grupoTaxa === grupo ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {ROTULO_GRUPO_TAXA_MAQUININHA[grupo]}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {carregandoTaxas ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : taxasMastercard.length === 0 && taxasOutros.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma taxa cadastrada ainda. Fale com o suporte pra cadastrar as taxas reais da sua maquininha por bandeira
          e parcela.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <TabelaTaxaGrupo grupo="mastercard" taxas={taxasMastercard} />
          <TabelaTaxaGrupo grupo="outros" taxas={taxasOutros} />
        </div>
      )}
    </div>
  )
}

export function FormasPagamento() {
  const { data: formas, isLoading } = useFormasPagamentoConfig()

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold">Formas de Pagamento</h1>
        <p className="text-sm text-muted-foreground">As 9 formas de pagamento do sistema são fixas — aqui você personaliza nome, cor, taxa, prazo e conta padrão de cada uma.</p>
      </div>

      <SecaoParcelamento />
      <SecaoTaxaMaquininha />

      <div className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {(formas ?? []).map((forma) => (
          <LinhaForma key={forma.codigo} forma={forma} />
        ))}
      </div>
    </div>
  )
}
