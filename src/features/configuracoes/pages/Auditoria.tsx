import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useHistoricoFinanceiro } from '@/features/financeiro/hooks/useAuditoriaFinanceira'
import { useHistoricoCaixa } from '@/features/caixa/hooks/useHistoricoCaixa'
import { useHistoricoConfiguracoes } from '../hooks/useAuditoriaConfig'

type Aba = 'financeiro' | 'caixa' | 'configuracoes'

function LinhaGenerica({ data, funcionario, acao, detalhes }: { data: string; funcionario: string | null; acao: string; detalhes: Record<string, unknown> | null }) {
  return (
    <tr className="border-t align-top">
      <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{new Date(data).toLocaleString('pt-BR')}</td>
      <td className="px-3 py-2">{funcionario ?? '-'}</td>
      <td className="px-3 py-2">{acao}</td>
      <td className="px-3 py-2 text-xs text-muted-foreground max-w-xs truncate" title={detalhes ? JSON.stringify(detalhes) : ''}>
        {detalhes ? JSON.stringify(detalhes) : '-'}
      </td>
    </tr>
  )
}

function TabelaHistorico({ children, carregando, vazio }: { children: React.ReactNode; carregando: boolean; vazio: boolean }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-muted-foreground">
          <tr>
            <th className="text-left font-medium px-3 py-2">Data</th>
            <th className="text-left font-medium px-3 py-2">Funcionário</th>
            <th className="text-left font-medium px-3 py-2">Ação</th>
            <th className="text-left font-medium px-3 py-2">Detalhes</th>
          </tr>
        </thead>
        <tbody>
          {carregando && (
            <tr>
              <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">Carregando...</td>
            </tr>
          )}
          {!carregando && vazio && (
            <tr>
              <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">Nenhum registro</td>
            </tr>
          )}
          {children}
        </tbody>
      </table>
    </div>
  )
}

export function Auditoria() {
  const [aba, setAba] = useState<Aba>('configuracoes')

  const financeiro = useHistoricoFinanceiro({ pageSize: 50 })
  const caixa = useHistoricoCaixa({ pageSize: 50 })
  const configuracoes = useHistoricoConfiguracoes()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Auditoria</h1>
        <p className="text-sm text-muted-foreground">
          Histórico de alterações do sistema, por área. O histórico de cada Funcionário fica na aba "Histórico" do próprio
          cadastro dele em{' '}
          <Link to="/funcionarios" className="text-primary underline">Funcionários</Link>, e o de cada Ordem de Serviço na
          própria tela de detalhe da OS.
        </p>
      </div>

      <div className="flex gap-2">
        {([
          { valor: 'configuracoes', rotulo: 'Configurações' },
          { valor: 'financeiro', rotulo: 'Financeiro' },
          { valor: 'caixa', rotulo: 'Caixa' },
        ] as const).map((item) => (
          <button
            key={item.valor}
            type="button"
            onClick={() => setAba(item.valor)}
            className={`h-8 px-3 rounded-md text-sm font-medium border ${aba === item.valor ? 'bg-primary text-primary-foreground border-primary' : 'bg-background'}`}
          >
            {item.rotulo}
          </button>
        ))}
      </div>

      {aba === 'configuracoes' && (
        <TabelaHistorico carregando={configuracoes.isLoading} vazio={(configuracoes.data ?? []).length === 0}>
          {(configuracoes.data ?? []).map((item) => (
            <LinhaGenerica key={item.id} data={item.createdAt} funcionario={item.funcionarioNome} acao={`${item.entidade}: ${item.acao}`} detalhes={item.detalhes} />
          ))}
        </TabelaHistorico>
      )}

      {aba === 'financeiro' && (
        <TabelaHistorico carregando={financeiro.isLoading} vazio={(financeiro.data?.data ?? []).length === 0}>
          {(financeiro.data?.data ?? []).map((item) => (
            <LinhaGenerica key={item.id} data={item.createdAt} funcionario={item.funcionarioNome} acao={`${item.entidade}: ${item.acao}`} detalhes={item.detalhes} />
          ))}
        </TabelaHistorico>
      )}

      {aba === 'caixa' && (
        <TabelaHistorico carregando={caixa.isLoading} vazio={(caixa.data?.data ?? []).length === 0}>
          {(caixa.data?.data ?? []).map((item) => (
            <LinhaGenerica
              key={item.id}
              data={item.createdAt}
              funcionario={item.funcionarioNome ?? null}
              acao={item.ordemNumero ? `OS nº ${item.ordemNumero}: ${item.acao}` : item.acao}
              detalhes={item.detalhes}
            />
          ))}
        </TabelaHistorico>
      )}
    </div>
  )
}
