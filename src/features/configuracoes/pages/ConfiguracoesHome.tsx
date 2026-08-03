import { Link } from 'react-router-dom'
import {
  Building2, Users, Landmark, CreditCard, Receipt, FileCheck2, Tags, Truck, Wrench, UserCog,
  Puzzle, Bell, DatabaseBackup, SlidersHorizontal, History, ShieldAlert, Sparkles, ArrowRight, MessageCircle,
} from 'lucide-react'

const SECOES = [
  { to: '/configuracoes/dados-oficina', icone: Building2, titulo: 'Dados da Oficina', descricao: 'Identificação, contato, endereço, logo e mensagens de impressão/WhatsApp.' },
  { to: '/funcionarios', icone: Users, titulo: 'Usuários e Permissões', descricao: 'Cadastro de funcionários e o que cada um pode acessar.' },
  { to: '/configuracoes/perfis', icone: ShieldAlert, titulo: 'Perfis de Permissão', descricao: 'Pacotes de permissões para aplicar rápido em um funcionário.' },
  { to: '/financeiro/contas-bancarias', icone: Landmark, titulo: 'Contas Bancárias', descricao: 'Gerenciadas no módulo Financeiro.' },
  { to: '/configuracoes/formas-pagamento', icone: CreditCard, titulo: 'Formas de Pagamento', descricao: 'Ícone, cor, taxa, prazo e a regra de parcelamento sem juros.' },
  { to: '/configuracoes/impostos', icone: Receipt, titulo: 'Impostos', descricao: 'NCM, CEST, CFOP e alíquotas para vincular a produtos.' },
  { to: '/configuracoes/nota-fiscal', icone: FileCheck2, titulo: 'Nota Fiscal', descricao: 'Ambiente e status da emissão de NFC-e/NF-e via Focus NFe.' },
  { to: '/configuracoes/whatsapp', icone: MessageCircle, titulo: 'WhatsApp', descricao: 'Mensagem automática ao cliente quando a OS é finalizada, via Evolution API.' },
  { to: '/configuracoes/categorias', icone: Tags, titulo: 'Categorias', descricao: 'Produtos, serviços, fornecedores, clientes e veículos.' },
  { to: '/fornecedores', icone: Truck, titulo: 'Fornecedores', descricao: 'Gerenciados no módulo Fornecedores.' },
  { to: '/configuracoes/mecanicos', icone: Wrench, titulo: 'Mecânicos', descricao: 'Especialidade e comissão de cada funcionário.' },
  { to: '/configuracoes/vendedores', icone: UserCog, titulo: 'Vendedores', descricao: 'Meta mensal de cada funcionário.' },
  { to: '/configuracoes/servicos', icone: Wrench, titulo: 'Serviços', descricao: 'Catálogo completo de serviços oferecidos.' },
  { to: '/configuracoes/integracoes', icone: Puzzle, titulo: 'Integrações', descricao: 'Tokens e chaves de serviços externos (sem automação real ainda).' },
  { to: '/configuracoes/notificacoes', icone: Bell, titulo: 'Notificações', descricao: 'Preferências de alertas (sem motor de notificação ainda).' },
  { to: '/configuracoes/backup', icone: DatabaseBackup, titulo: 'Backup', descricao: 'Como o backup real funciona e checkpoints manuais.' },
  { to: '/configuracoes/preferencias', icone: SlidersHorizontal, titulo: 'Preferências', descricao: 'Tema, itens por página, numeração e impressões.' },
  { to: '/configuracoes/auditoria', icone: History, titulo: 'Auditoria', descricao: 'Histórico de alterações por área do sistema.' },
  { to: '/configuracoes/seguranca', icone: ShieldAlert, titulo: 'Segurança', descricao: 'O que já está protegido e o que depende de infraestrutura.' },
  { to: '/configuracoes/atualizacoes', icone: Sparkles, titulo: 'Atualizações', descricao: 'Changelog de versões do sistema.' },
]

export function ConfiguracoesHome() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Configurações</h1>
        <p className="text-sm text-muted-foreground">Produtos Genéricos (sem controle de estoque) não foi construído ainda — hoje nada no sistema pede esse tipo de item.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SECOES.map((secao) => (
          <Link key={secao.to} to={secao.to} className="rounded-lg border p-4 flex items-start gap-3 hover:bg-muted/30 transition-colors">
            <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <secao.icone size={18} />
            </div>
            <div className="flex-1">
              <h2 className="font-medium text-sm">{secao.titulo}</h2>
              <p className="text-xs text-muted-foreground">{secao.descricao}</p>
            </div>
            <ArrowRight size={14} className="text-muted-foreground shrink-0 mt-1.5" />
          </Link>
        ))}
      </div>
    </div>
  )
}
