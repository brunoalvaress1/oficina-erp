-- Configuração global da plataforma (não é por oficina) — hoje só guarda a
-- chave PIX de cobrança da mensalidade do sistema, que até aqui estava
-- hardcoded no código-fonte (CHAVE_PIX_SISTEMA em
-- src/features/pagamentoSistema/constants.ts). Agora o super admin edita
-- pela tela e toda oficina lê daqui (mesmo bloqueada — ela PRECISA ver a
-- chave pra conseguir pagar e se desbloquear).
--
-- Sem RPC/edge function: o super admin escreve direto via RLS (policy de
-- update abaixo), simples o bastante pra não precisar de function dedicada.
create table public.configuracoes_plataforma (
  id text primary key default 'global',
  chave_pix text,
  mensagem_urgencia text,
  updated_at timestamptz not null default now()
);

insert into public.configuracoes_plataforma (id, chave_pix, mensagem_urgencia)
values ('global', '(19) 99912-0418', 'Não fique sem seu sistema — faça já o pagamento!');

alter table public.configuracoes_plataforma enable row level security;

-- Qualquer usuário autenticado lê — inclusive funcionário de oficina
-- bloqueada, que é justamente quem mais precisa ver a chave pra pagar.
create policy configuracoes_plataforma_leitura on public.configuracoes_plataforma
  for select
  to authenticated
  using (true);

-- Só super admin escreve.
create policy configuracoes_plataforma_escrita on public.configuracoes_plataforma
  for update
  to authenticated
  using (exists (select 1 from public.super_admins where user_id = auth.uid()))
  with check (exists (select 1 from public.super_admins where user_id = auth.uid()));
