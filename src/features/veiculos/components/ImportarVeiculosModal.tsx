import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ImportPreviewTable } from './ImportPreviewTable'
import { ImportResultDialog } from './ImportResultDialog'
import { useGerarPreviewImportacao, useConfirmarImportacao } from '../hooks/useImportarVeiculos'
import type { LinhaImportacaoPreview, ResultadoImportacao } from '../types/importacao'

interface ImportarVeiculosModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Etapa = 'selecionar' | 'preview' | 'resultado'

export function ImportarVeiculosModal({ open, onOpenChange }: ImportarVeiculosModalProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [etapa, setEtapa] = useState<Etapa>('selecionar')
  const [linhas, setLinhas] = useState<LinhaImportacaoPreview[]>([])
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null)

  const gerarPreview = useGerarPreviewImportacao()
  const confirmarImportacao = useConfirmarImportacao()

  function resetar() {
    setEtapa('selecionar')
    setLinhas([])
    setResultado(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleFechar(novoEstado: boolean) {
    if (!novoEstado) resetar()
    onOpenChange(novoEstado)
  }

  async function handleArquivoSelecionado(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0]
    if (!arquivo) return

    const conteudo = await arquivo.text()

    gerarPreview.mutate(conteudo, {
      onSuccess: (linhasGeradas) => {
        setLinhas(linhasGeradas)
        setEtapa('preview')
      },
    })
  }

  function handleConfirmar() {
    confirmarImportacao.mutate(linhas, {
      onSuccess: (resultadoImportacao) => {
        setResultado(resultadoImportacao)
        setEtapa('resultado')
      },
    })
  }

  const validas = linhas.filter((linha) => linha.status === 'valido').length

  return (
    <Dialog open={open} onOpenChange={handleFechar}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Veículos via CSV</DialogTitle>
        </DialogHeader>

        {etapa === 'selecionar' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Envie um arquivo CSV com as colunas <strong>placa</strong>, <strong>modelo</strong>, marca,
              cor, ano, km_atual, cliente_cpf_cnpj (ou cliente_nome) e observacoes. É obrigatório informar
              a placa, o modelo e o CPF/CNPJ ou nome de um cliente já cadastrado.
            </p>

            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleArquivoSelecionado}
              disabled={gerarPreview.isPending}
              className="block w-full text-sm file:mr-3 file:h-9 file:px-4 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground file:text-sm file:font-medium"
            />

            {gerarPreview.isPending && (
              <p className="text-sm text-muted-foreground">Processando arquivo...</p>
            )}
          </div>
        )}

        {etapa === 'preview' && (
          <div className="space-y-4">
            <ImportPreviewTable linhas={linhas} />

            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                {validas} de {linhas.length} linha(s) serão importadas
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={resetar}
                  className="h-9 px-4 rounded-md border text-sm font-medium"
                >
                  Escolher outro arquivo
                </button>
                <button
                  type="button"
                  onClick={handleConfirmar}
                  disabled={validas === 0 || confirmarImportacao.isPending}
                  className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                >
                  {confirmarImportacao.isPending ? 'Importando...' : `Importar ${validas} veículo(s)`}
                </button>
              </div>
            </div>
          </div>
        )}

        {etapa === 'resultado' && resultado && (
          <ImportResultDialog resultado={resultado} onFechar={() => handleFechar(false)} />
        )}
      </DialogContent>
    </Dialog>
  )
}
