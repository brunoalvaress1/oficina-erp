import { useEffect, useState } from 'react'
import { useTheme } from '@/providers/ThemeProvider'
import {
  useAtualizarConfiguracaoImpressao,
  useAtualizarConfiguracaoNumeracao,
  useConfiguracaoImpressao,
  useConfiguracaoNumeracao,
} from '../hooks/useImpressaoNumeracao'
import { usePreferencias, useSalvarPreferencias } from '../hooks/usePreferencias'

const TELAS_INICIAIS = [
  { valor: '/', rotulo: 'Dashboard' },
  { valor: '/ordens', rotulo: 'Ordens de Serviço' },
  { valor: '/caixa', rotulo: 'Caixa' },
  { valor: '/clientes', rotulo: 'Clientes' },
]

function SecaoTema() {
  const { modo, setTheme } = useTheme()
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <h2 className="font-medium text-sm">Tema</h2>
      <div className="flex gap-2">
        {(['claro', 'escuro', 'sistema'] as const).map((opcao) => {
          const valorModo = opcao === 'claro' ? 'light' : opcao === 'escuro' ? 'dark' : 'sistema'
          return (
            <button
              key={opcao}
              type="button"
              onClick={() => setTheme(valorModo)}
              className={`h-9 px-4 rounded-md text-sm font-medium border capitalize ${modo === valorModo ? 'bg-primary text-primary-foreground border-primary' : 'bg-background'}`}
            >
              {opcao}
            </button>
          )
        })}
      </div>
      <p className="text-xs text-muted-foreground">"Sistema" acompanha automaticamente o tema claro/escuro do seu computador.</p>
    </div>
  )
}

function SecaoPreferenciasPessoais() {
  const { data: preferencias } = usePreferencias()
  const salvar = useSalvarPreferencias()

  const [itensPorPagina, setItensPorPagina] = useState('20')
  const [telaInicial, setTelaInicial] = useState('/')
  const [salvarFiltros, setSalvarFiltros] = useState(true)

  useEffect(() => {
    if (preferencias) {
      setItensPorPagina(String(preferencias.itensPorPagina))
      setTelaInicial(preferencias.telaInicial ?? '/')
      setSalvarFiltros(preferencias.salvarFiltros)
    }
  }, [preferencias])

  function handleSalvar() {
    salvar.mutate({ itensPorPagina: Number(itensPorPagina) || 20, telaInicial, salvarFiltros })
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <h2 className="font-medium text-sm">Preferências pessoais</h2>
      <p className="text-xs text-muted-foreground">
        Essas preferências ainda não estão conectadas em todas as telas antigas do sistema — vão sendo aplicadas aos poucos.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Itens por página</label>
          <input
            type="number"
            value={itensPorPagina}
            onChange={(e) => setItensPorPagina(e.target.value)}
            className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Tela inicial</label>
          <select value={telaInicial} onChange={(e) => setTelaInicial(e.target.value)} className="w-full h-9 rounded-md border bg-background px-3 text-sm">
            {TELAS_INICIAIS.map((t) => (
              <option key={t.valor} value={t.valor}>{t.rotulo}</option>
            ))}
          </select>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={salvarFiltros} onChange={(e) => setSalvarFiltros(e.target.checked)} />
        Lembrar os últimos filtros usados
      </label>
      <button type="button" onClick={handleSalvar} disabled={salvar.isPending} className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
        {salvar.isPending ? 'Salvando...' : 'Salvar'}
      </button>
    </div>
  )
}

function SecaoNumeracao() {
  const { data: numeracao } = useConfiguracaoNumeracao()
  const salvar = useAtualizarConfiguracaoNumeracao()

  const [prefixoOs, setPrefixoOs] = useState('')
  const [prefixoNf, setPrefixoNf] = useState('')
  const [paddingDigitos, setPaddingDigitos] = useState('6')

  useEffect(() => {
    if (numeracao) {
      setPrefixoOs(numeracao.prefixoOs ?? '')
      setPrefixoNf(numeracao.prefixoNf ?? '')
      setPaddingDigitos(String(numeracao.paddingDigitos))
    }
  }, [numeracao])

  function handleSalvar() {
    salvar.mutate({ prefixoOs: prefixoOs || null, prefixoNf: prefixoNf || null, paddingDigitos: Number(paddingDigitos) || 6 })
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <h2 className="font-medium text-sm">Numeração</h2>
      <p className="text-xs text-muted-foreground">Prefixo aplicado só na exibição (PDF, impressão, WhatsApp) — não altera o número interno da OS.</p>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Prefixo OS</label>
          <input value={prefixoOs} onChange={(e) => setPrefixoOs(e.target.value)} placeholder="OS-" className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Prefixo NF</label>
          <input value={prefixoNf} onChange={(e) => setPrefixoNf(e.target.value)} placeholder="NF-" className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Dígitos</label>
          <input type="number" value={paddingDigitos} onChange={(e) => setPaddingDigitos(e.target.value)} className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30" />
        </div>
      </div>
      <button type="button" onClick={handleSalvar} disabled={salvar.isPending} className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
        {salvar.isPending ? 'Salvando...' : 'Salvar'}
      </button>
    </div>
  )
}

function SecaoImpressao() {
  const { data: impressao } = useConfiguracaoImpressao()
  const salvar = useAtualizarConfiguracaoImpressao()

  const [tamanhoPapel, setTamanhoPapel] = useState<'A4' | 'A5' | 'bobina'>('A4')
  const [margemMm, setMargemMm] = useState('32')

  useEffect(() => {
    if (impressao) {
      setTamanhoPapel(impressao.tamanhoPapel)
      setMargemMm(String(impressao.margemMm))
    }
  }, [impressao])

  function handleSalvar() {
    salvar.mutate({ tamanhoPapel, margemMm: Number(margemMm) || 32 })
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <h2 className="font-medium text-sm">Impressões</h2>
      <div className="grid grid-cols-2 gap-3 max-w-sm">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Tamanho do papel</label>
          <select value={tamanhoPapel} onChange={(e) => setTamanhoPapel(e.target.value as 'A4' | 'A5' | 'bobina')} className="w-full h-9 rounded-md border bg-background px-3 text-sm">
            <option value="A4">A4</option>
            <option value="A5">A5</option>
            <option value="bobina">Bobina</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Margem (mm)</label>
          <input type="number" value={margemMm} onChange={(e) => setMargemMm(e.target.value)} className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30" />
        </div>
      </div>
      <button type="button" onClick={handleSalvar} disabled={salvar.isPending} className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
        {salvar.isPending ? 'Salvando...' : 'Salvar'}
      </button>
    </div>
  )
}

export function Preferencias() {
  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-semibold">Preferências</h1>
      <SecaoTema />
      <SecaoPreferenciasPessoais />
      <SecaoNumeracao />
      <SecaoImpressao />
    </div>
  )
}
