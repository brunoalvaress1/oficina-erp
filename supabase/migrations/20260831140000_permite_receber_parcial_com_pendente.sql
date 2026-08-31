-- Permite receber PARTE do valor de uma OS e deixar o restante como
-- "pendente" no mesmo lançamento, em vez de exigir tudo pago de uma vez ou
-- tudo pendente (única opção existente até aqui). Ex: cliente paga R$1000 no
-- Pix de uma OS de R$1500 — os R$1000 entram normalmente no caixa e os
-- R$500 restantes ficam marcados como pendentes, sem sumir da tela de
-- Pendentes, até serem cobrados depois (reabrindo o mesmo modal, que já
-- desconta o que foi recebido nessa primeira rodada).
--
-- Implementado como uma forma de pagamento especial 'pendente' — o
-- vendedor escolhe ela no lugar de Pix/Dinheiro/Cartão pro valor que falta.
-- Ela entra na conta pra fechar o total da OS (mesma validação de sempre),
-- mas NÃO gera movimentação financeira (não é dinheiro de verdade) e faz o
-- lançamento continuar com status 'pendente' em vez de 'recebido'.

alter table public.caixa_recebimento_formas
  drop constraint caixa_recebimento_formas_forma_pagamento_check;

alter table public.caixa_recebimento_formas
  add constraint caixa_recebimento_formas_forma_pagamento_check
  check (forma_pagamento = any (array['dinheiro','pix','debito','credito','transferencia','cheque','crediario','boleto','outros','pendente']));

create or replace function public.caixa_receber(
  p_caixa_lancamento_id uuid,
  p_funcionario_id uuid,
  p_ip text,
  p_formas jsonb,
  p_desconto numeric default 0
)
returns uuid
language plpgsql
security definer
as $function$
declare
  v_lancamento public.caixa_lancamentos%rowtype;
  v_ordem public.ordens_servico%rowtype;
  v_sessao_id uuid;
  v_recebimento_id uuid;
  v_forma jsonb;
  v_valor numeric;
  v_juros numeric;
  v_valor_bruto numeric;
  v_soma_real numeric := 0;    -- soma desta rodada SEM as formas 'pendente' (dinheiro de verdade)
  v_soma_pendente numeric := 0; -- soma desta rodada só das formas 'pendente'
  v_forma_id uuid;
  v_desconto numeric := coalesce(p_desconto, 0);
  v_ja_recebido numeric := 0;  -- soma de formas reais já recebidas em rodadas anteriores não canceladas
  v_ja_desconto numeric := 0;  -- desconto já aplicado em rodadas anteriores não canceladas
  v_tem_pendente boolean := false;
begin
  select * into v_lancamento from public.caixa_lancamentos where id = p_caixa_lancamento_id for update;
  if not found then
    raise exception 'LANCAMENTO_NAO_ENCONTRADO';
  end if;
  if v_lancamento.status not in ('aguardando', 'pendente') then
    raise exception 'LANCAMENTO_JA_PROCESSADO';
  end if;

  if v_lancamento.ordem_servico_id is not null then
    select * into v_ordem from public.ordens_servico where id = v_lancamento.ordem_servico_id;
    if not found then
      raise exception 'ORDEM_NAO_ENCONTRADA';
    end if;
  end if;

  select id into v_sessao_id from public.caixa_sessoes
  where oficina_id = v_lancamento.oficina_id and status = 'aberto'
  limit 1;

  if v_sessao_id is null then
    raise exception 'CAIXA_FECHADO';
  end if;

  -- Quanto já foi efetivamente recebido (dinheiro real) e descontado em
  -- rodadas anteriores desse mesmo lançamento (caso de um recebimento
  -- parcial anterior que deixou parte como pendente).
  select coalesce(sum(f.valor), 0) into v_ja_recebido
  from public.caixa_recebimento_formas f
  join public.caixa_recebimentos r on r.id = f.caixa_recebimento_id
  where r.caixa_lancamento_id = p_caixa_lancamento_id and not r.cancelado and f.forma_pagamento <> 'pendente';

  select coalesce(sum(r.desconto), 0) into v_ja_desconto
  from public.caixa_recebimentos r
  where r.caixa_lancamento_id = p_caixa_lancamento_id and not r.cancelado;

  for v_forma in select * from jsonb_array_elements(coalesce(p_formas, '[]'::jsonb))
  loop
    v_valor := coalesce((v_forma->>'valor')::numeric, 0);
    if (v_forma->>'formaPagamento') = 'pendente' then
      v_soma_pendente := v_soma_pendente + v_valor;
    else
      v_soma_real := v_soma_real + v_valor;
    end if;
  end loop;

  if v_ordem.id is not null
     and round(v_ja_recebido + v_ja_desconto + v_soma_real + v_soma_pendente + v_desconto, 2) is distinct from round(v_ordem.valor_total, 2) then
    raise exception 'VALOR_NAO_CONFERE: informado % (+ pendente % + já recebido % + desconto %) esperado %',
      v_soma_real, v_soma_pendente, v_ja_recebido, v_ja_desconto + v_desconto, v_ordem.valor_total;
  end if;

  -- valor_total do recebimento é só o dinheiro de verdade dessa rodada —
  -- a parte deixada pendente não conta como "recebido" nos dashboards
  -- (buscarDashboardCaixa soma caixa_recebimentos.valor_total).
  insert into public.caixa_recebimentos (caixa_lancamento_id, funcionario_id, valor_total, caixa_sessao_id, desconto)
  values (p_caixa_lancamento_id, p_funcionario_id, v_soma_real, v_sessao_id, v_desconto)
  returning id into v_recebimento_id;

  for v_forma in select * from jsonb_array_elements(coalesce(p_formas, '[]'::jsonb))
  loop
    v_valor := coalesce((v_forma->>'valor')::numeric, 0);
    v_juros := coalesce(nullif(v_forma->>'jurosPercentual', '')::numeric, 0);
    v_valor_bruto := v_valor * (1 + v_juros / 100);

    insert into public.caixa_recebimento_formas (
      caixa_recebimento_id, forma_pagamento, valor, valor_recebido, conta_bancaria_id,
      parcelas, bandeira, maquininha, juros_percentual, valor_liquido
    ) values (
      v_recebimento_id,
      v_forma->>'formaPagamento',
      v_valor,
      nullif(v_forma->>'valorRecebido', '')::numeric,
      nullif(v_forma->>'contaBancariaId', '')::uuid,
      nullif(v_forma->>'parcelas', '')::integer,
      nullif(v_forma->>'bandeira', ''),
      nullif(v_forma->>'maquininha', ''),
      nullif(v_forma->>'jurosPercentual', '')::numeric,
      v_valor
    )
    returning id into v_forma_id;

    if (v_forma->>'formaPagamento') = 'pendente' then
      if v_valor > 0 then
        v_tem_pendente := true;
      end if;
      -- não gera movimentação financeira: não é dinheiro que entrou de fato.
      continue;
    end if;

    insert into public.movimentacoes_financeiras (
      oficina_id, data_movimentacao, descricao, tipo, origem, conta_bancaria_id, forma_pagamento,
      valor_bruto, taxa, valor_liquido, responsavel_id, referencia_tipo, referencia_id, created_by
    ) values (
      v_lancamento.oficina_id, current_date,
      case when v_ordem.numero is not null then 'OS ' || v_ordem.numero else 'Recebimento avulso' end,
      'entrada', 'os', nullif(v_forma->>'contaBancariaId', '')::uuid, v_forma->>'formaPagamento',
      v_valor_bruto, v_valor_bruto - v_valor, v_valor, p_funcionario_id,
      'caixa_recebimento_forma', v_forma_id, p_funcionario_id
    );
  end loop;

  update public.caixa_lancamentos
  set status = case when v_tem_pendente then 'pendente' else 'recebido' end, updated_at = now()
  where id = p_caixa_lancamento_id;

  insert into public.caixa_lancamento_historico (caixa_lancamento_id, funcionario_id, acao, detalhes, ip)
  values (
    p_caixa_lancamento_id, p_funcionario_id,
    case when v_tem_pendente then 'recebido_parcial' else 'recebido' end,
    jsonb_build_object('valorTotal', v_soma_real, 'valorPendente', v_soma_pendente, 'desconto', v_desconto, 'formas', p_formas),
    p_ip
  );

  return v_recebimento_id;
end;
$function$;
