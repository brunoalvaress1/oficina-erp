import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDate } from '@/utils/format'
import { ROTULO_STATUS_ORDEM, type StatusOrdemServico } from '../types/ordemServico'

interface ItemPublico {
  descricao: string
  quantidade: number
  valorUnitario: number
  valorTotal: number
  tipo: string
}

interface OsPublica {
  numero: number
  status: StatusOrdemServico
  dataAbertura: string
  valorTotal: number
  veiculoPlaca: string | null
  veiculoModelo: string | null
  clienteNome: string | null
  itens: ItemPublico[]
  oficina: { nome: string; telefone: string | null; endereco: string; logoUrl: string | null }
}

// Página PÚBLICA (sem login) — acessada pelo cliente via link recebido no
// WhatsApp após o pagamento da OS. Registrada fora do bloco <ProtectedRoute>
// em AppRoutes.tsx de propósito.
export function AcompanharOs() {
  const { id } = useParams<{ id: string }>()
  const [dados, setDados] = useState<OsPublica | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (!id) return
    setCarregando(true)
    setErro(null)
    supabase.functions
      .invoke('consultar-os-publica', { body: { ordemServicoId: id } })
      .then(({ data, error }) => {
        if (error) throw error
        setDados(data)
      })
      .catch(() => setErro('Não foi possível encontrar essa ordem de serviço.'))
      .finally(() => setCarregando(false))
  }, [id])

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  if (erro || !dados) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <p className="text-sm text-destructive text-center">{erro ?? 'Ordem de serviço não encontrada.'}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-md mx-auto bg-background rounded-lg border shadow-sm overflow-hidden">
        <div className="p-5 border-b flex items-center gap-3">
          {dados.oficina.logoUrl && <img src={dados.oficina.logoUrl} alt="" className="h-14 w-14 rounded-md object-contain border" />}
          <div>
            {dados.oficina.endereco && <p className="text-xs text-muted-foreground">{dados.oficina.endereco}</p>}
            {dados.oficina.telefone && <p className="text-xs text-muted-foreground">{dados.oficina.telefone}</p>}
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <p className="text-xs text-muted-foreground">Ordem de Serviço</p>
            <p className="text-xl font-semibold">nº {dados.numero}</p>
            <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              {ROTULO_STATUS_ORDEM[dados.status] ?? dados.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Cliente</p>
              <p>{dados.clienteNome ?? '-'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Data</p>
              <p>{formatDate(dados.dataAbertura)}</p>
            </div>
            {dados.veiculoModelo && (
              <div>
                <p className="text-xs text-muted-foreground">Veículo</p>
                <p>{dados.veiculoModelo}</p>
              </div>
            )}
            {dados.veiculoPlaca && (
              <div>
                <p className="text-xs text-muted-foreground">Placa</p>
                <p>{dados.veiculoPlaca}</p>
              </div>
            )}
          </div>

          <div className="border rounded-lg divide-y">
            {dados.itens.map((item, indice) => (
              <div key={indice} className="flex items-center justify-between px-3 py-2 text-sm">
                <span>{item.descricao} (x{item.quantidade})</span>
                <span className="font-medium">{formatCurrency(item.valorTotal)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between px-3 py-2 text-sm font-semibold bg-muted/20">
              <span>Total</span>
              <span>{formatCurrency(dados.valorTotal)}</span>
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground pt-2">Obrigado pela preferência!</p>
        </div>
      </div>
    </div>
  )
}
