import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CatalogoSimples } from '../components/CatalogoSimples'
import type { TabelaCatalogo } from '../types/catalogos'

const ABAS: { tabela: TabelaCatalogo; rotulo: string; placeholder: string }[] = [
  { tabela: 'categorias_produtos', rotulo: 'Produtos', placeholder: 'Nova categoria de produto...' },
  { tabela: 'categorias_servicos', rotulo: 'Serviços', placeholder: 'Nova categoria de serviço...' },
  { tabela: 'categorias_fornecedores', rotulo: 'Fornecedores', placeholder: 'Nova categoria de fornecedor...' },
  { tabela: 'categorias_clientes', rotulo: 'Clientes', placeholder: 'Nova categoria de cliente...' },
  { tabela: 'categorias_veiculos', rotulo: 'Veículos', placeholder: 'Nova categoria de veículo...' },
]

export function Categorias() {
  const [aba, setAba] = useState<TabelaCatalogo>('categorias_produtos')
  const abaAtual = ABAS.find((a) => a.tabela === aba)!

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold">Categorias</h1>
        <p className="text-sm text-muted-foreground">
          Categorias financeiras (receita/despesa) ficam em{' '}
          <Link to="/financeiro/categorias" className="text-primary underline">
            Financeiro → Categorias
          </Link>
          .
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {ABAS.map((item) => (
          <button
            key={item.tabela}
            type="button"
            onClick={() => setAba(item.tabela)}
            className={`h-8 px-3 rounded-md text-sm font-medium border ${aba === item.tabela ? 'bg-primary text-primary-foreground border-primary' : 'bg-background'}`}
          >
            {item.rotulo}
          </button>
        ))}
      </div>

      <CatalogoSimples tabela={abaAtual.tabela} placeholder={abaAtual.placeholder} />
    </div>
  )
}
