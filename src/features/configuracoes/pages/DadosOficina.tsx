import { useEffect, useState } from 'react'
import { Upload } from 'lucide-react'
import { useAtualizarDadosOficina, useDadosOficina, useEnviarLogoOficina } from '../hooks/useOficina'
import { ROTULO_REGIME_TRIBUTARIO, type DadosOficinaInput, type RegimeTributario } from '../types/oficina'

const CAMPO_VAZIO: DadosOficinaInput = {
  nomeFantasia: '', razaoSocial: '', cnpj: '', inscricaoEstadual: '', regimeTributario: null, telefone: '', whatsapp: '', email: '',
  cep: '', endereco: '', numero: '', bairro: '', cidade: '', estado: '', codigoMunicipio: '', logoUrl: null, site: '', instagram: '',
  facebook: '', horarioFuncionamento: '', observacoes: '', nomeImpressao: '', rodapeImpressao: '',
  mensagemAgradecimento: '', mensagemOs: '', mensagemWhatsappPadrao: '',
}

function Campo({ label, value, onChange, placeholder, textarea }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; textarea?: boolean }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/30"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30"
        />
      )}
    </div>
  )
}

export function DadosOficina() {
  const { data: oficina, isLoading } = useDadosOficina()
  const atualizar = useAtualizarDadosOficina()
  const enviarLogo = useEnviarLogoOficina()

  const [form, setForm] = useState<DadosOficinaInput>(CAMPO_VAZIO)

  useEffect(() => {
    if (oficina) {
      const { id, ...resto } = oficina
      setForm(resto)
    }
  }, [oficina])

  function set<K extends keyof DadosOficinaInput>(campo: K, valor: DadosOficinaInput[K]) {
    setForm((atual) => ({ ...atual, [campo]: valor }))
  }

  function handleSalvar() {
    atualizar.mutate(form)
  }

  function handleLogo(event: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0]
    if (arquivo) enviarLogo.mutate(arquivo)
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando...</p>

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-semibold">Dados da Oficina</h1>

      <div className="rounded-lg border p-4 space-y-3">
        <h2 className="font-medium text-sm">Logo</h2>
        <div className="flex items-center gap-4">
          {oficina?.logoUrl && <img src={oficina.logoUrl} alt="Logo" className="h-16 w-16 object-contain rounded-md border" />}
          <label className="flex items-center gap-2 h-9 px-4 rounded-md border text-sm font-medium cursor-pointer">
            <Upload size={14} /> {enviarLogo.isPending ? 'Enviando...' : 'Enviar logo'}
            <input type="file" accept="image/*" className="hidden" onChange={handleLogo} disabled={enviarLogo.isPending} />
          </label>
        </div>
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <h2 className="font-medium text-sm">Identificação</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Campo label="Nome Fantasia" value={form.nomeFantasia ?? ''} onChange={(v) => set('nomeFantasia', v)} />
          <Campo label="Razão Social" value={form.razaoSocial ?? ''} onChange={(v) => set('razaoSocial', v)} />
          <Campo label="CNPJ" value={form.cnpj ?? ''} onChange={(v) => set('cnpj', v)} />
          <Campo label="Inscrição Estadual" value={form.inscricaoEstadual ?? ''} onChange={(v) => set('inscricaoEstadual', v)} />
          <div className="space-y-1">
            <label className="text-sm font-medium">Regime Tributário</label>
            <select
              value={form.regimeTributario ?? ''}
              onChange={(e) => set('regimeTributario', (e.target.value || null) as RegimeTributario | null)}
              className="w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30"
            >
              <option value="">Não definido</option>
              {(Object.keys(ROTULO_REGIME_TRIBUTARIO) as RegimeTributario[]).map((regime) => (
                <option key={regime} value={regime}>{ROTULO_REGIME_TRIBUTARIO[regime]}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">Usado como referência — os prazos da Reforma Tributária (campos IBS/CBS) variam conforme o regime.</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <h2 className="font-medium text-sm">Contato</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Campo label="Telefone" value={form.telefone ?? ''} onChange={(v) => set('telefone', v)} />
          <Campo label="WhatsApp" value={form.whatsapp ?? ''} onChange={(v) => set('whatsapp', v)} />
          <Campo label="E-mail" value={form.email ?? ''} onChange={(v) => set('email', v)} />
          <Campo label="Site" value={form.site ?? ''} onChange={(v) => set('site', v)} />
          <Campo label="Instagram" value={form.instagram ?? ''} onChange={(v) => set('instagram', v)} />
          <Campo label="Facebook" value={form.facebook ?? ''} onChange={(v) => set('facebook', v)} />
        </div>
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <h2 className="font-medium text-sm">Endereço</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Campo label="CEP" value={form.cep ?? ''} onChange={(v) => set('cep', v)} />
          <Campo label="Endereço" value={form.endereco ?? ''} onChange={(v) => set('endereco', v)} />
          <Campo label="Número" value={form.numero ?? ''} onChange={(v) => set('numero', v)} />
          <Campo label="Bairro" value={form.bairro ?? ''} onChange={(v) => set('bairro', v)} />
          <Campo label="Cidade" value={form.cidade ?? ''} onChange={(v) => set('cidade', v)} />
          <Campo label="Estado" value={form.estado ?? ''} onChange={(v) => set('estado', v)} />
          <Campo label="Código do Município (IBGE)" value={form.codigoMunicipio ?? ''} onChange={(v) => set('codigoMunicipio', v)} placeholder="Ex: 3548906" />
        </div>
        <p className="text-xs text-muted-foreground -mt-1">Código IBGE de 7 dígitos da cidade — exigido para emissão de Nota Fiscal (NFC-e/NF-e/NFS-e). Consulte em <span className="whitespace-nowrap">https://www.ibge.gov.br/explica/codigos-dos-municipios.php</span></p>
        <Campo label="Horário de Funcionamento" value={form.horarioFuncionamento ?? ''} onChange={(v) => set('horarioFuncionamento', v)} placeholder="Seg a Sex, 8h às 18h" />
        <Campo label="Observações" value={form.observacoes ?? ''} onChange={(v) => set('observacoes', v)} textarea />
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <h2 className="font-medium text-sm">Impressões e Mensagens</h2>
        <Campo label="Nome nas impressões" value={form.nomeImpressao ?? ''} onChange={(v) => set('nomeImpressao', v)} />
        <Campo label="Rodapé das impressões" value={form.rodapeImpressao ?? ''} onChange={(v) => set('rodapeImpressao', v)} textarea />
        <Campo label="Mensagem padrão de agradecimento" value={form.mensagemAgradecimento ?? ''} onChange={(v) => set('mensagemAgradecimento', v)} textarea />
        <Campo label="Mensagem da OS (impressão)" value={form.mensagemOs ?? ''} onChange={(v) => set('mensagemOs', v)} textarea />
        <Campo
          label="Mensagem padrão do WhatsApp (OS pronta)"
          value={form.mensagemWhatsappPadrao ?? ''}
          onChange={(v) => set('mensagemWhatsappPadrao', v)}
          placeholder="Olá {cliente}! Sua OS nº {os} está pronta. Valor: {valor}. Equipe {empresa}."
          textarea
        />
        <p className="text-xs text-muted-foreground">Variáveis disponíveis: {'{cliente} {os} {valor} {empresa}'}</p>
      </div>

      <button
        type="button"
        disabled={atualizar.isPending}
        onClick={handleSalvar}
        className="h-10 px-6 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
      >
        {atualizar.isPending ? 'Salvando...' : 'Salvar'}
      </button>
    </div>
  )
}
