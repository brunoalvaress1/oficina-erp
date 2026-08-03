import { useState } from 'react'
import { X } from 'lucide-react'
import { Combobox } from '@/components/ui/Combobox'
import { CampoMoeda } from '@/components/ui/CampoMoeda'
import { useContasBancariasBusca, useCriarContaBancaria } from '../hooks/useContasBancarias'
import { useMaquininhasBusca, useCriarMaquininha } from '../hooks/useMaquininhas'
import { useBandeirasCartaoBusca, useCriarBandeiraCartao } from '../hooks/useBandeirasCartao'
import { useConfiguracaoParcelamento } from '@/features/configuracoes/hooks/usePagamentosConfig'
import { calcularJurosPercentual, calcularTroco, calcularValorComJuros, type FormaPagamentoForm } from '../types/formaPagamentoForm'
import { ROTULO_FORMA_PAGAMENTO, type FormaPagamento } from '../types/caixa'
import { formatCurrency } from '@/utils/format'
import type { ContaBancaria } from '../types/contaBancaria'
import type { Maquininha } from '../types/maquininha'
import type { BandeiraCartao } from '../types/bandeiraCartao'

interface FormaPagamentoRowProps {
  forma: FormaPagamentoForm
  onChange: (forma: FormaPagamentoForm) => void
  onRemover: () => void
  podeRemover: boolean
}

const OPCOES_PARCELAS = Array.from({ length: 12 }, (_, i) => i + 1)

export function FormaPagamentoRow({ forma, onChange, onRemover, podeRemover }: FormaPagamentoRowProps) {
  const [termoContaBancaria, setTermoContaBancaria] = useState('')
  const [termoMaquininha, setTermoMaquininha] = useState('')
  const [termoBandeira, setTermoBandeira] = useState('')
  const { data: contasEncontradas = [] } = useContasBancariasBusca(termoContaBancaria)
  const { data: maquininhasEncontradas = [] } = useMaquininhasBusca(termoMaquininha)
  const { data: bandeirasEncontradas = [] } = useBandeirasCartaoBusca(termoBandeira)
  const criarContaBancaria = useCriarContaBancaria()
  const criarMaquininha = useCriarMaquininha()
  const criarBandeira = useCriarBandeiraCartao()
  const { data: parcelamento } = useConfiguracaoParcelamento()
  const parcelasSemJuros = parcelamento?.parcelasSemJuros ?? 6
  const jurosPercentual = parcelamento?.jurosPercentual ?? 8

  function atualizar(alteracoes: Partial<FormaPagamentoForm>) {
    onChange({ ...forma, ...alteracoes })
  }

  function handleCriarConta(nome: string) {
    criarContaBancaria.mutate(nome, { onSuccess: (conta) => atualizar({ contaBancaria: conta }) })
  }

  function handleCriarMaquininha(nome: string) {
    criarMaquininha.mutate(nome, { onSuccess: (maquininha) => atualizar({ maquininha }) })
  }

  function handleCriarBandeira(nome: string) {
    criarBandeira.mutate(nome, { onSuccess: (bandeira) => atualizar({ bandeira }) })
  }

  const ehCartao = forma.formaPagamento === 'debito' || forma.formaPagamento === 'credito'
  const ehDinheiro = forma.formaPagamento === 'dinheiro'
  const juros = calcularJurosPercentual(forma.formaPagamento, forma.parcelas, parcelasSemJuros, jurosPercentual)
  const valorComJuros = calcularValorComJuros(forma, parcelasSemJuros, jurosPercentual)
  const troco = calcularTroco(forma)

  return (
    <div className="rounded-lg border p-3 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 flex-1">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Forma de Pagamento</label>
            <select
              value={forma.formaPagamento}
              onChange={(e) => atualizar({ formaPagamento: e.target.value as FormaPagamento })}
              className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30"
            >
              {(Object.keys(ROTULO_FORMA_PAGAMENTO) as FormaPagamento[]).map((f) => (
                <option key={f} value={f}>
                  {ROTULO_FORMA_PAGAMENTO[f]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Valor</label>
            <CampoMoeda
              value={forma.valor}
              onChange={(v) => atualizar({ valor: v })}
              className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Conta Bancária</label>
            <Combobox<ContaBancaria>
              value={forma.contaBancaria}
              onSelect={(conta) => atualizar({ contaBancaria: conta })}
              onSearch={setTermoContaBancaria}
              items={contasEncontradas}
              getKey={(c) => c.id}
              getLabel={(c) => c.nome}
              placeholder="Selecionar conta..."
              onCriarNovo={handleCriarConta}
              criarNovoLabel={(termo) => `Criar conta "${termo}"`}
            />
          </div>

          {ehDinheiro && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Valor Recebido</label>
              <CampoMoeda
                value={forma.valorRecebido}
                onChange={(v) => atualizar({ valorRecebido: v })}
                className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
          )}

          {ehCartao && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Maquininha</label>
                <Combobox<Maquininha>
                  value={forma.maquininha}
                  onSelect={(maquininha) => atualizar({ maquininha })}
                  onSearch={setTermoMaquininha}
                  items={maquininhasEncontradas}
                  getKey={(m) => m.id}
                  getLabel={(m) => m.nome}
                  placeholder="Selecionar maquininha..."
                  onCriarNovo={handleCriarMaquininha}
                  criarNovoLabel={(termo) => `Cadastrar maquininha "${termo}"`}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Bandeira (opcional)</label>
                <Combobox<BandeiraCartao>
                  value={forma.bandeira}
                  onSelect={(bandeira) => atualizar({ bandeira })}
                  onSearch={setTermoBandeira}
                  items={bandeirasEncontradas}
                  getKey={(b) => b.id}
                  getLabel={(b) => b.nome}
                  placeholder="Selecionar bandeira..."
                  onCriarNovo={handleCriarBandeira}
                  criarNovoLabel={(termo) => `Cadastrar bandeira "${termo}"`}
                />
              </div>
            </>
          )}

          {forma.formaPagamento === 'credito' && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Parcelas</label>
              <select
                value={forma.parcelas}
                onChange={(e) => atualizar({ parcelas: e.target.value })}
                className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30"
              >
                {OPCOES_PARCELAS.map((p) => (
                  <option key={p} value={p}>
                    {p}x {p > parcelasSemJuros ? `(${jurosPercentual}% de juros)` : 'sem juros'}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {podeRemover && (
          <button
            type="button"
            onClick={onRemover}
            className="p-1.5 rounded hover:bg-muted text-destructive shrink-0"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {ehDinheiro && troco > 0 && (
        <p className="text-xs text-green-600">Troco: {formatCurrency(troco)}</p>
      )}
      {juros > 0 && (
        <p className="text-xs text-amber-600">
          Com juros de parcelamento: {formatCurrency(valorComJuros)} cobrados do cliente (valor abatido da OS continua {formatCurrency(Number(forma.valor) || 0)})
        </p>
      )}
    </div>
  )
}
