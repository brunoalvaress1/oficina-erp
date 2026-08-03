import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ROTULO_FORMA_PAGAMENTO } from '@/features/caixa/types/caixa'
import { useContasBancariasLista } from '@/features/financeiro/hooks/useContasBancariasFinanceiro'
import {
  useAtualizarConfiguracaoParcelamento,
  useAtualizarFormaPagamentoConfig,
  useConfiguracaoParcelamento,
  useFormasPagamentoConfig,
} from '../hooks/usePagamentosConfig'
import type { FormaPagamentoConfig } from '../types/pagamentos'

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

export function FormasPagamento() {
  const { data: formas, isLoading } = useFormasPagamentoConfig()

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold">Formas de Pagamento</h1>
        <p className="text-sm text-muted-foreground">As 9 formas de pagamento do sistema são fixas — aqui você personaliza nome, cor, taxa, prazo e conta padrão de cada uma.</p>
      </div>

      <SecaoParcelamento />

      <div className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {(formas ?? []).map((forma) => (
          <LinhaForma key={forma.codigo} forma={forma} />
        ))}
      </div>
    </div>
  )
}
