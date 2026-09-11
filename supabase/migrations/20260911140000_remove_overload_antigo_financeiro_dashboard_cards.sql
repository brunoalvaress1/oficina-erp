-- financeiro_dashboard_cards ficou com DUAS versões no banco: a antiga (sem
-- p_data_inicio/p_data_fim) nunca foi removida quando a migration
-- 20260827173808_financeiro_cards_respeita_periodo.sql criou a nova com mais
-- parâmetros — CREATE OR REPLACE só substitui uma função de MESMA
-- assinatura, com parâmetros diferentes ele cria um overload novo em vez de
-- substituir. A versão antiga ficou morta (o frontend sempre manda
-- p_data_inicio/p_data_fim, então o Postgres sempre resolve pra versão
-- nova), mas é confusão/risco desnecessário deixar as duas.
drop function if exists public.financeiro_dashboard_cards(uuid, uuid, text, uuid, uuid);
