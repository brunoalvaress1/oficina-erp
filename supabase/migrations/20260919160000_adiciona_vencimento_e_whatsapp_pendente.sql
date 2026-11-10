-- Permite definir uma data-limite de pagamento ao marcar uma OS como
-- Pendente, pra poder avisar o cliente por WhatsApp com essa data.
--
-- public.caixa_marcar_pendente(uuid, uuid, text, text) é anterior ao
-- controle de migrations deste repo (não temos o código-fonte dela aqui) —
-- por isso, em vez de arriscar reescrevê-la às cegas e quebrar alguma
-- validação/efeito que ela já faça hoje, criamos um OVERLOAD (mesmo nome,
-- um parâmetro extra) que primeiro CHAMA a function original (preservando
-- 100% do comportamento dela) e só então acrescenta o vencimento. Quem
-- chama sem data continua caindo no overload antigo, sem nenhuma mudança.
alter table public.caixa_lancamentos
  add column data_vencimento_pendente date;

create or replace function public.caixa_marcar_pendente(
  p_caixa_lancamento_id uuid,
  p_funcionario_id uuid,
  p_ip text,
  p_observacoes text,
  p_data_vencimento date
)
returns void
language plpgsql
security definer
as $function$
begin
  perform public.caixa_marcar_pendente(p_caixa_lancamento_id, p_funcionario_id, p_ip, p_observacoes);

  update public.caixa_lancamentos
  set data_vencimento_pendente = p_data_vencimento
  where id = p_caixa_lancamento_id;

  if p_data_vencimento is not null then
    insert into public.caixa_lancamento_historico (caixa_lancamento_id, funcionario_id, acao, detalhes, ip)
    values (
      p_caixa_lancamento_id, p_funcionario_id, 'prazo_pagamento_definido',
      jsonb_build_object('dataVencimento', p_data_vencimento), p_ip
    );
  end if;
end;
$function$;
