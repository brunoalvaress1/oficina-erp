import { Routes, Route } from 'react-router-dom'
import { MainLayout } from '@/layouts/MainLayout'
import { AdminLayout } from '@/layouts/AdminLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { PermissionRoute } from './PermissionRoute'
import { SuperAdminRoute } from './SuperAdminRoute'
import { SuperAdminOficinas } from '@/features/superAdmin/pages/SuperAdminOficinas'
import { Login } from '@/pages/Login'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { ClientesList } from '@/features/clientes/pages/ClientesList'
import { VeiculosList } from '@/features/veiculos/pages/VeiculosList'
import { ProdutosList } from '@/features/produtos/pages/ProdutosList'
import { MovimentoEstoque } from '@/features/estoque/pages/MovimentoEstoque'
import { LancarEstoque } from '@/features/estoque/pages/LancarEstoque'
import { NotasFiscaisList } from '@/features/estoque/pages/NotasFiscaisList'
import { EditarNotaFiscal } from '@/features/estoque/pages/EditarNotaFiscal'
import { FornecedoresList } from '@/features/fornecedores/pages/FornecedoresList'
import { OrdensList } from '@/features/ordens/pages/OrdensList'
import { OrdemForm } from '@/features/ordens/pages/OrdemForm'
import { ItensRecusados } from '@/features/ordens/pages/ItensRecusados'
import { AcompanharOs } from '@/features/ordens/pages/AcompanharOs'
import { CaixaList } from '@/features/caixa/pages/CaixaList'
import { Pendentes as CaixaPendentes } from '@/features/caixa/pages/Pendentes'
import { Historico as CaixaHistorico } from '@/features/caixa/pages/Historico'
import { DashboardFinanceiro } from '@/features/financeiro/pages/DashboardFinanceiro'
import { ContasReceber } from '@/features/financeiro/pages/ContasReceber'
import { ContasPagar } from '@/features/financeiro/pages/ContasPagar'
import { FluxoCaixa } from '@/features/financeiro/pages/FluxoCaixa'
import { Movimentacoes } from '@/features/financeiro/pages/Movimentacoes'
import { ContasBancarias } from '@/features/financeiro/pages/ContasBancarias'
import { CategoriasFinanceiras } from '@/features/financeiro/pages/CategoriasFinanceiras'
import { Conciliacao } from '@/features/financeiro/pages/Conciliacao'
import { AuditoriaFinanceira } from '@/features/financeiro/pages/AuditoriaFinanceira'
import { FuncionariosList } from '@/features/funcionarios/pages/FuncionariosList'
import { RelatoriosHome } from '@/features/relatorios/pages/RelatoriosHome'
import { RelatorioLucroPecas } from '@/features/relatorios/pages/RelatorioLucroPecas'
import { RelatorioLucroServicos } from '@/features/relatorios/pages/RelatorioLucroServicos'
import { ConfiguracoesHome } from '@/features/configuracoes/pages/ConfiguracoesHome'
import { DadosOficina } from '@/features/configuracoes/pages/DadosOficina'
import { Perfis } from '@/features/configuracoes/pages/Perfis'
import { FormasPagamento } from '@/features/configuracoes/pages/FormasPagamento'
import { Impostos } from '@/features/configuracoes/pages/Impostos'
import { Categorias } from '@/features/configuracoes/pages/Categorias'
import { Mecanicos } from '@/features/configuracoes/pages/Mecanicos'
import { Vendedores } from '@/features/configuracoes/pages/Vendedores'
import { Servicos } from '@/features/configuracoes/pages/Servicos'
import { Integracoes } from '@/features/configuracoes/pages/Integracoes'
import { Notificacoes } from '@/features/configuracoes/pages/Notificacoes'
import { Backup } from '@/features/configuracoes/pages/Backup'
import { Preferencias } from '@/features/configuracoes/pages/Preferencias'
import { Auditoria } from '@/features/configuracoes/pages/Auditoria'
import { Seguranca } from '@/features/configuracoes/pages/Seguranca'
import { Atualizacoes } from '@/features/configuracoes/pages/Atualizacoes'
import { NotaFiscal } from '@/features/configuracoes/pages/NotaFiscal'
import { WhatsApp } from '@/features/configuracoes/pages/WhatsApp'
import { NotasFiscaisSaidaList } from '@/features/notasFiscaisSaida/pages/NotasFiscaisSaidaList'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      {/* Pública, sem login — acessada pelo cliente via link do WhatsApp após pagar a OS. */}
      <Route path="/os/:id" element={<AcompanharOs />} />

      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<PlaceholderPage title="Dashboard" />} />

        <Route path="/clientes" element={<PermissionRoute codigo="clientes.visualizar"><ClientesList /></PermissionRoute>} />
        <Route path="/clientes/novo" element={<PermissionRoute codigo="clientes.visualizar"><PlaceholderPage title="Novo Cliente" /></PermissionRoute>} />
        <Route path="/clientes/:id" element={<PermissionRoute codigo="clientes.visualizar"><PlaceholderPage title="Detalhes do Cliente" /></PermissionRoute>} />

        <Route path="/veiculos" element={<PermissionRoute codigo="veiculos.visualizar"><VeiculosList /></PermissionRoute>} />

        <Route path="/produtos" element={<PermissionRoute codigo="produtos.visualizar"><ProdutosList /></PermissionRoute>} />

        <Route path="/estoque" element={<PermissionRoute codigo="estoque.visualizar"><MovimentoEstoque /></PermissionRoute>} />
        <Route path="/estoque/lancar" element={<PermissionRoute codigo="estoque.visualizar"><LancarEstoque /></PermissionRoute>} />
        <Route path="/estoque/notas" element={<PermissionRoute codigo="estoque.visualizar"><NotasFiscaisList /></PermissionRoute>} />
        <Route path="/estoque/notas/:id" element={<PermissionRoute codigo="estoque.visualizar"><EditarNotaFiscal /></PermissionRoute>} />

        <Route path="/fornecedores" element={<PermissionRoute codigo="fornecedores.visualizar"><FornecedoresList /></PermissionRoute>} />

        <Route path="/ordens" element={<PermissionRoute codigo="ordens.visualizar"><OrdensList /></PermissionRoute>} />
        <Route path="/ordens/nova" element={<PermissionRoute codigo="ordens.visualizar"><OrdemForm /></PermissionRoute>} />
        <Route path="/ordens/itens-recusados" element={<PermissionRoute codigo="ordens.visualizar"><ItensRecusados /></PermissionRoute>} />
        <Route path="/ordens/:id" element={<PermissionRoute codigo="ordens.visualizar"><OrdemForm /></PermissionRoute>} />

        <Route path="/caixa" element={<PermissionRoute codigo="caixa.visualizar"><CaixaList /></PermissionRoute>} />
        <Route path="/caixa/pendentes" element={<PermissionRoute codigo="caixa.visualizar"><CaixaPendentes /></PermissionRoute>} />
        <Route path="/caixa/historico" element={<PermissionRoute codigo="caixa.visualizar"><CaixaHistorico /></PermissionRoute>} />

        <Route path="/financeiro" element={<PermissionRoute codigo="financeiro.visualizar"><DashboardFinanceiro /></PermissionRoute>} />
        <Route path="/financeiro/contas-a-receber" element={<PermissionRoute codigo="financeiro.visualizar"><ContasReceber /></PermissionRoute>} />
        <Route path="/financeiro/contas-a-pagar" element={<PermissionRoute codigo="financeiro.visualizar"><ContasPagar /></PermissionRoute>} />
        <Route path="/financeiro/fluxo-de-caixa" element={<PermissionRoute codigo="financeiro.visualizar"><FluxoCaixa /></PermissionRoute>} />
        <Route path="/financeiro/movimentacoes" element={<PermissionRoute codigo="financeiro.visualizar"><Movimentacoes /></PermissionRoute>} />
        <Route path="/financeiro/contas-bancarias" element={<PermissionRoute codigo="financeiro.visualizar"><ContasBancarias /></PermissionRoute>} />
        <Route path="/financeiro/categorias" element={<PermissionRoute codigo="financeiro.visualizar"><CategoriasFinanceiras /></PermissionRoute>} />
        <Route path="/financeiro/conciliacao" element={<PermissionRoute codigo="financeiro.visualizar"><Conciliacao /></PermissionRoute>} />
        <Route path="/financeiro/auditoria" element={<PermissionRoute codigo="financeiro.visualizar"><AuditoriaFinanceira /></PermissionRoute>} />

        <Route path="/funcionarios" element={<PermissionRoute codigo="funcionarios.visualizar"><FuncionariosList /></PermissionRoute>} />

        <Route path="/relatorios" element={<PermissionRoute codigo="relatorios.visualizar"><RelatoriosHome /></PermissionRoute>} />
        <Route path="/relatorios/lucro-pecas" element={<PermissionRoute codigo="relatorios.visualizar"><RelatorioLucroPecas /></PermissionRoute>} />
        <Route path="/relatorios/lucro-servicos" element={<PermissionRoute codigo="relatorios.visualizar"><RelatorioLucroServicos /></PermissionRoute>} />
        <Route path="/configuracoes" element={<PermissionRoute codigo="configuracoes.visualizar"><ConfiguracoesHome /></PermissionRoute>} />
        <Route path="/configuracoes/dados-oficina" element={<PermissionRoute codigo="configuracoes.visualizar"><DadosOficina /></PermissionRoute>} />
        <Route path="/configuracoes/perfis" element={<PermissionRoute codigo="configuracoes.visualizar"><Perfis /></PermissionRoute>} />
        <Route path="/configuracoes/formas-pagamento" element={<PermissionRoute codigo="configuracoes.visualizar"><FormasPagamento /></PermissionRoute>} />
        <Route path="/configuracoes/impostos" element={<PermissionRoute codigo="configuracoes.visualizar"><Impostos /></PermissionRoute>} />
        <Route path="/configuracoes/categorias" element={<PermissionRoute codigo="configuracoes.visualizar"><Categorias /></PermissionRoute>} />
        <Route path="/configuracoes/mecanicos" element={<PermissionRoute codigo="configuracoes.visualizar"><Mecanicos /></PermissionRoute>} />
        <Route path="/configuracoes/vendedores" element={<PermissionRoute codigo="configuracoes.visualizar"><Vendedores /></PermissionRoute>} />
        <Route path="/configuracoes/servicos" element={<PermissionRoute codigo="configuracoes.visualizar"><Servicos /></PermissionRoute>} />
        <Route path="/configuracoes/integracoes" element={<PermissionRoute codigo="configuracoes.visualizar"><Integracoes /></PermissionRoute>} />
        <Route path="/configuracoes/notificacoes" element={<PermissionRoute codigo="configuracoes.visualizar"><Notificacoes /></PermissionRoute>} />
        <Route path="/configuracoes/backup" element={<PermissionRoute codigo="configuracoes.visualizar"><Backup /></PermissionRoute>} />
        <Route path="/configuracoes/preferencias" element={<PermissionRoute codigo="configuracoes.visualizar"><Preferencias /></PermissionRoute>} />
        <Route path="/configuracoes/auditoria" element={<PermissionRoute codigo="configuracoes.visualizar"><Auditoria /></PermissionRoute>} />
        <Route path="/configuracoes/seguranca" element={<PermissionRoute codigo="configuracoes.visualizar"><Seguranca /></PermissionRoute>} />
        <Route path="/configuracoes/atualizacoes" element={<PermissionRoute codigo="configuracoes.visualizar"><Atualizacoes /></PermissionRoute>} />
        <Route path="/configuracoes/nota-fiscal" element={<PermissionRoute codigo="configuracoes.visualizar"><NotaFiscal /></PermissionRoute>} />
        <Route path="/configuracoes/whatsapp" element={<PermissionRoute codigo="configuracoes.visualizar"><WhatsApp /></PermissionRoute>} />

        <Route path="/notas-fiscais" element={<PermissionRoute codigo="notas_fiscais.visualizar"><NotasFiscaisSaidaList /></PermissionRoute>} />
      </Route>

      {/* Painel do dono do sistema — layout e login completamente separados
          do sistema de uma oficina (sem sidebar de operação). */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute admin>
            <SuperAdminRoute>
              <AdminLayout />
            </SuperAdminRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<SuperAdminOficinas />} />
        <Route path="oficinas" element={<SuperAdminOficinas />} />
      </Route>

      <Route path="*" element={<PlaceholderPage title="Página não encontrada (404)" />} />
    </Routes>
  )
}
