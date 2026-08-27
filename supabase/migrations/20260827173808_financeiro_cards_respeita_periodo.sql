-- Os cards "Receita no Mês", "Despesas no Mês", "Lucro Bruto", "Lucro
-- Líquido", "Ticket Médio" e "Ordens Recebidas" do Dashboard Financeiro
-- ignoravam completamente o filtro de período da tela (FiltroFinanceiroBar)
-- — a função sempre calculava com base no mês corrente (date_trunc('month',
-- current_date) até hoje), então trocar o período no filtro nunca mudava
-- esses números. Só "Receita/Despesas Hoje" (literalmente hoje, sem relação
-- com o filtro) e os gráficos (que já recebem p_data_inicio/p_data_fim numa
-- RPC separada) funcionavam.
--
-- Adiciona p_data_inicio/p_data_fim (opcionais, default = mês corrente até
-- hoje — mesmo comportamento de antes se não informado) e troca "mês" por
-- esse intervalo em tudo que não for literalmente "hoje".
create or replace function public.financeiro_dashboard_cards(
  p_oficina_id uuid,
  p_conta_bancaria_id uuid default null,
  p_forma_pagamento text default null,
  p_categoria_id uuid default null,
  p_centro_custo_id uuid default null,
  p_data_inicio date default null,
  p_data_fim date default null
)
returns jsonb
language plpgsql
security definer
as $function$
declare
  v_hoje date := current_date;
  v_inicio_periodo date := coalesce(p_data_inicio, date_trunc('month', current_date)::date);
  v_fim_periodo date := coalesce(p_data_fim, v_hoje);
  v_receita_hoje numeric;
  v_receita_periodo numeric;
  v_despesa_hoje numeric;
  v_despesa_periodo numeric;
  v_ticket_medio numeric;
  v_ordens_recebidas integer;
  v_pendencias_qtd integer;
  v_pendencias_valor numeric;
  v_lucro_bruto_periodo numeric;
begin
  select coalesce(sum(valor_liquido), 0) into v_receita_hoje
  from public.movimentacoes_financeiras
  where oficina_id = p_oficina_id and tipo = 'entrada' and data_movimentacao = v_hoje
    and (p_conta_bancaria_id is null or conta_bancaria_id = p_conta_bancaria_id)
    and (p_forma_pagamento is null or forma_pagamento = p_forma_pagamento)
    and (p_categoria_id is null or categoria_id = p_categoria_id)
    and (p_centro_custo_id is null or centro_custo_id = p_centro_custo_id);

  select coalesce(sum(valor_liquido), 0) into v_receita_periodo
  from public.movimentacoes_financeiras
  where oficina_id = p_oficina_id and tipo = 'entrada' and data_movimentacao between v_inicio_periodo and v_fim_periodo
    and (p_conta_bancaria_id is null or conta_bancaria_id = p_conta_bancaria_id)
    and (p_forma_pagamento is null or forma_pagamento = p_forma_pagamento)
    and (p_categoria_id is null or categoria_id = p_categoria_id)
    and (p_centro_custo_id is null or centro_custo_id = p_centro_custo_id);

  select coalesce(sum(valor_liquido), 0) into v_despesa_hoje
  from public.movimentacoes_financeiras
  where oficina_id = p_oficina_id and tipo = 'saida' and origem <> 'transferencia' and data_movimentacao = v_hoje
    and (p_conta_bancaria_id is null or conta_bancaria_id = p_conta_bancaria_id)
    and (p_forma_pagamento is null or forma_pagamento = p_forma_pagamento)
    and (p_categoria_id is null or categoria_id = p_categoria_id)
    and (p_centro_custo_id is null or centro_custo_id = p_centro_custo_id);

  select coalesce(sum(valor_liquido), 0) into v_despesa_periodo
  from public.movimentacoes_financeiras
  where oficina_id = p_oficina_id and tipo = 'saida' and origem <> 'transferencia' and data_movimentacao between v_inicio_periodo and v_fim_periodo
    and (p_conta_bancaria_id is null or conta_bancaria_id = p_conta_bancaria_id)
    and (p_forma_pagamento is null or forma_pagamento = p_forma_pagamento)
    and (p_categoria_id is null or categoria_id = p_categoria_id)
    and (p_centro_custo_id is null or centro_custo_id = p_centro_custo_id);

  select count(*) into v_ordens_recebidas
  from public.caixa_lancamentos cl
  where cl.oficina_id = p_oficina_id and cl.status = 'recebido'
    and cl.updated_at::date between v_inicio_periodo and v_fim_periodo;

  v_ticket_medio := coalesce(v_receita_periodo / nullif(v_ordens_recebidas, 0), 0);

  select count(*), coalesce(sum(valor - valor_recebido), 0)
  into v_pendencias_qtd, v_pendencias_valor
  from public.contas_receber
  where oficina_id = p_oficina_id and status in ('pendente', 'parcial');

  v_pendencias_qtd := v_pendencias_qtd
    + (select count(*) from public.caixa_lancamentos where oficina_id = p_oficina_id and status in ('aguardando', 'pendente'))
    + (select count(*) from public.contas_pagar where oficina_id = p_oficina_id and status in ('pendente', 'parcial'));

  -- Lucro bruto do período: soma do lucro de cada item das OS recebidas no
  -- intervalo (serviço = 100% lucro; produto = valor - custo) — mesma
  -- fórmula do módulo de OS.
  select coalesce(sum(
    case when oi.tipo = 'servico' then oi.valor_total
         when oi.valor_custo is not null then oi.valor_total - oi.valor_custo * oi.quantidade
         else oi.valor_total end
  ), 0)
  into v_lucro_bruto_periodo
  from public.ordem_servico_itens oi
  join public.ordens_servico os on os.id = oi.ordem_servico_id
  join public.caixa_lancamentos cl on cl.ordem_servico_id = os.id
  where os.oficina_id = p_oficina_id and cl.status = 'recebido'
    and cl.updated_at::date between v_inicio_periodo and v_fim_periodo;

  return jsonb_build_object(
    'receitaHoje', v_receita_hoje,
    'receitaMes', v_receita_periodo,
    'despesaHoje', v_despesa_hoje,
    'despesaMes', v_despesa_periodo,
    'lucroBruto', v_lucro_bruto_periodo,
    'lucroLiquido', v_lucro_bruto_periodo - v_despesa_periodo,
    'ticketMedio', v_ticket_medio,
    'ordensRecebidas', v_ordens_recebidas,
    'pdvsRecebidos', 0,
    'pendenciasQuantidade', v_pendencias_qtd,
    'pendenciasValor', v_pendencias_valor
  );
end;
$function$;
