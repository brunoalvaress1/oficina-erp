import { ShieldCheck, ShieldAlert } from 'lucide-react'

const ITENS = [
  {
    titulo: 'Autenticação',
    situacao: 'Ativo',
    descricao: 'Login por e-mail e senha via Supabase Auth, com senha mínima de 6 caracteres.',
    ok: true,
  },
  {
    titulo: 'Permissões por funcionário',
    situacao: 'Ativo',
    descricao: 'Cada funcionário só acessa telas e ações liberadas explicitamente para ele (veja Funcionários → Permissões).',
    ok: true,
  },
  {
    titulo: 'Autenticação em duas etapas (2FA)',
    situacao: 'Não disponível',
    descricao: 'Exigiria configuração adicional no provedor de autenticação — não é algo que dá pra ligar só pelo app.',
    ok: false,
  },
  {
    titulo: 'Expiração automática de sessão',
    situacao: 'Não disponível',
    descricao: 'O tempo de sessão é controlado pela infraestrutura de autenticação, não pelo aplicativo.',
    ok: false,
  },
  {
    titulo: 'Bloqueio por tentativas de login',
    situacao: 'Não disponível',
    descricao: 'Precisaria de uma função de backend dedicada, que não existe hoje.',
    ok: false,
  },
]

export function Seguranca() {
  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">Segurança</h1>
        <p className="text-sm text-muted-foreground">
          Esta tela é só informativa — não tem toggles que fingem ligar algo que não existe de verdade. Mostra o que já está
          protegido e o que dependeria de infraestrutura fora do alcance deste aplicativo.
        </p>
      </div>

      <div className="space-y-3">
        {ITENS.map((item) => (
          <div key={item.titulo} className="rounded-lg border p-4 flex gap-3">
            {item.ok ? <ShieldCheck size={20} className="text-green-600 shrink-0 mt-0.5" /> : <ShieldAlert size={20} className="text-amber-500 shrink-0 mt-0.5" />}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-medium text-sm">{item.titulo}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full ${item.ok ? 'bg-green-500/10 text-green-600' : 'bg-amber-500/10 text-amber-600'}`}>{item.situacao}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{item.descricao}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
