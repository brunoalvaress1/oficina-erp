import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ImportPreviewTable } from './ImportPreviewTable'
import { ImportResultDialog } from './ImportResultDialog'
import { useGerarPreviewImportacaoProdutos, useConfirmarImportacaoProdutos } from '../hooks/useImportarProdutos'
import type { LinhaImportacaoProdutoPreview, ResultadoImportacaoProduto } from '../types/importacaoProduto'

interface ImportarProdutosModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Etapa = 'selecionar' | 'preview' | 'resultado'

export function ImportarProdutosModal({ open, onOpenChange }: ImportarProdutosModalProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [etapa, setEtapa] = useState<Etapa>('selecionar')
  const [linhas, setLinhas] = useState<LinhaImportacaoProdutoPreview[]>([])
  const [resultado, setResultado] = useState<ResultadoImportacaoProduto | null>(null)

  const gerarPreview = useGerarPreviewImportacaoProdutos()
  const confirmarImportacao = useConfirmarImportacaoProdutos()

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
          <DialogTitle>Importar Produtos via CSV</DialogTitle>
        </DialogHeader>

        {etapa === 'selecionar' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Envie um arquivo CSV com as colunas <strong>nome</strong> (ou "Nome interno"/"Nome
              externo"), categoria, subcategoria, marca, código fabricante/interno, valor_custo,
              valor_os (ou "Valor O.S"), estoque_fisico e ncm. Só o nome é obrigatório.
            </p>

            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleArquivoSelecionado}
              disabled={gerarPreview.isPending}
              className="block w-full text-sm file:mr-3 file:h-9 file:px-4 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground file:text-sm file:font-medium"
            />

            {gerarPreview.isPending && <p className="text-sm text-muted-foreground">Processando arquivo...</p>}
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
                <button type="button" onClick={resetar} className="h-9 px-4 rounded-md border text-sm font-medium">
                  Escolher outro arquivo
                </button>
                <button
                  type="button"
                  onClick={handleConfirmar}
                  disabled={validas === 0 || confirmarImportacao.isPending}
                  className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                >
                  {confirmarImportacao.isPending ? 'Importando...' : `Importar ${validas} produto(s)`}
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
