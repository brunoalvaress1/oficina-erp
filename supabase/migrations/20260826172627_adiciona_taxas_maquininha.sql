-- Tabela de taxas de maquininha por bandeira (agrupada em "mastercard" x
-- "outros cartoes", conforme a tabela de taxas real repassada pela
-- adquirente) x tipo (debito/credito) x parcelas (1x-12x no credito). Usada
-- pra estimar quanto a oficina perde de taxa em vendas parceladas no
-- credito, principalmente quando o parcelamento e "sem juros" pro cliente
-- (juros_percentual = 0 em caixa_recebimento_formas) e a taxa e 100%
-- absorvida pela oficina.
--
-- E deliberadamente separada de configuracoes_parcelamento (que so guarda a
-- REGRA DE REPASSE ao cliente - até quantas parcelas sem juros, e quanto de
-- juros cobrar acima disso) e de formas_pagamento_config.taxa_percentual
-- (uma taxa unica "achatada" por forma de pagamento, sem granularidade de
-- parcela) - nenhuma das duas serve pra saber o CUSTO real da maquininha por
-- parcela.
create table public.taxas_maquininha (
  id uuid primary key default gen_random_uuid(),
  oficina_id uuid not null references public.oficinas(id) on delete cascade,
  grupo_taxa text not null check (grupo_taxa in ('mastercard', 'outros')),
  tipo text not null check (tipo in ('debito', 'credito')),
  parcelas integer not null default 1 check (parcelas between 1 and 12),
  taxa_percentual numeric(6, 3) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (oficina_id, grupo_taxa, tipo, parcelas)
);

alter table public.taxas_maquininha enable row level security;

create policy taxas_maquininha_por_oficina on public.taxas_maquininha
  for all to authenticated
  using (oficina_id = public.minha_oficina_id())
  with check (oficina_id = public.minha_oficina_id());

-- Bandeira (Mastercard, Visa, Elo...) precisa saber em qual dos dois grupos
-- de taxa ela entra - todo cartao que nao for Mastercard cai em "outros" por
-- padrao (e o caso mais comum: Visa, Elo, Amex etc. costumam ter a mesma
-- taxa entre si, diferente só da Mastercard).
alter table public.bandeiras_cartao
  add column grupo_taxa text not null default 'outros' check (grupo_taxa in ('mastercard', 'outros'));

-- Semeia as taxas reais da oficina (repassadas pelo usuario) e marca a
-- bandeira "Master" ja cadastrada como grupo mastercard. Novas oficinas nao
-- ganham nenhuma linha aqui (cada uma negocia sua propria taxa com a
-- adquirente) - a tela de Configuracoes > Formas de Pagamento permite
-- cadastrar/editar isso pra qualquer oficina.
do $$
declare
  v_oficina_id uuid := '1ccd4def-f9ad-4bd1-876a-ebcbe7857141';
begin
  update public.bandeiras_cartao
  set grupo_taxa = 'mastercard'
  where oficina_id = v_oficina_id and lower(nome) like 'master%';

  insert into public.taxas_maquininha (oficina_id, grupo_taxa, tipo, parcelas, taxa_percentual)
  values
    (v_oficina_id, 'mastercard', 'debito', 1, 0.89),
    (v_oficina_id, 'mastercard', 'credito', 1, 2.89),
    (v_oficina_id, 'mastercard', 'credito', 2, 3.99),
    (v_oficina_id, 'mastercard', 'credito', 3, 4.59),
    (v_oficina_id, 'mastercard', 'credito', 4, 5.19),
    (v_oficina_id, 'mastercard', 'credito', 5, 5.79),
    (v_oficina_id, 'mastercard', 'credito', 6, 6.49),
    (v_oficina_id, 'mastercard', 'credito', 7, 7.29),
    (v_oficina_id, 'mastercard', 'credito', 8, 7.79),
    (v_oficina_id, 'mastercard', 'credito', 9, 8.49),
    (v_oficina_id, 'mastercard', 'credito', 10, 8.99),
    (v_oficina_id, 'mastercard', 'credito', 11, 9.79),
    (v_oficina_id, 'mastercard', 'credito', 12, 9.99),
    (v_oficina_id, 'outros', 'debito', 1, 1.59),
    (v_oficina_id, 'outros', 'credito', 1, 3.99),
    (v_oficina_id, 'outros', 'credito', 2, 4.99),
    (v_oficina_id, 'outros', 'credito', 3, 5.59),
    (v_oficina_id, 'outros', 'credito', 4, 6.19),
    (v_oficina_id, 'outros', 'credito', 5, 6.79),
    (v_oficina_id, 'outros', 'credito', 6, 7.49),
    (v_oficina_id, 'outros', 'credito', 7, 8.29),
    (v_oficina_id, 'outros', 'credito', 8, 8.79),
    (v_oficina_id, 'outros', 'credito', 9, 9.49),
    (v_oficina_id, 'outros', 'credito', 10, 9.99),
    (v_oficina_id, 'outros', 'credito', 11, 10.79),
    (v_oficina_id, 'outros', 'credito', 12, 10.99)
  on conflict (oficina_id, grupo_taxa, tipo, parcelas) do nothing;
end $$;
