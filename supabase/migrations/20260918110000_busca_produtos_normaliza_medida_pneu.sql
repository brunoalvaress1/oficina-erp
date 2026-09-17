-- Medida de pneu (ex: 205/60R16) tem "/" e "R" entre os números, mas quase
-- ninguém digita exatamente assim na busca — vem "205 60 16", "205/60/16",
-- "205x60r16" etc. Como busca_normalizada guardava a medida do jeito
-- ORIGINAL (com "/" e "r"), essas variações só achavam o pneu certo pela
-- busca "parecida" (fuzzy) — que rankeia mal quando o texto tem muitos
-- números (ex: pesquisar "205 60 16" trazia pneu errado antes do certo).
--
-- Correção: normaliza também a pontuação entre números — "/", "-" e "r"
-- (letra sozinha entre dois números, que só aparece nesse contexto de
-- medida) viram espaço. "205/60R16" e "205 60 16" passam a gerar a MESMA
-- string normalizada, então a busca por substring (ilike, o caminho "bateu
-- certinho" da RPC) funciona de novo em vez de cair no fuzzy.
create or replace function public.f_normalizar_produto(texto text)
returns text
language sql
immutable
parallel safe
as $$
  select regexp_replace(
    regexp_replace(
      public.f_unaccent(coalesce(texto, '')),
      '(\d)[/-](\d)', '\1 \2', 'g'
    ),
    '(\d)r(\d)', '\1 \2', 'g'
  )
$$;

-- Coluna gerada não aceita "ALTER expressão" — precisa recriar (Postgres
-- recalcula pra todo mundo sozinho, é STORED).
alter table public.produtos drop column busca_normalizada;

alter table public.produtos
  add column busca_normalizada text
  generated always as (
    public.f_normalizar_produto(lower(
      coalesce(nome, '') || ' ' ||
      coalesce(categoria, '') || ' ' ||
      coalesce(subcategoria, '') || ' ' ||
      coalesce(marca, '') || ' ' ||
      coalesce(codigo_fabricante, '') || ' ' ||
      coalesce(codigo_interno, '') || ' ' ||
      coalesce(codigo_barras, '') || ' ' ||
      coalesce(ncm, '')
    ))
  ) stored;

create index if not exists produtos_busca_normalizada_trgm_idx
  on public.produtos using gin (busca_normalizada gin_trgm_ops);

-- A RPC usava f_unaccent(lower(...)) direto no termo de busca — troca pra
-- f_normalizar_produto (que já inclui o unaccent) pra bater com o mesmo
-- tratamento da coluna.
create or replace function public.produtos_buscar(p_termo text default '', p_limit integer default 300, p_offset integer default 0)
returns setof public.produtos
language sql
stable
as $$
  select p.*
  from public.produtos p
  where p_termo is null or btrim(p_termo) = ''
     or p.busca_normalizada ilike '%' || public.f_normalizar_produto(lower(btrim(p_termo))) || '%'
     or word_similarity(public.f_normalizar_produto(lower(btrim(p_termo))), p.busca_normalizada) >= 0.4
  order by
    case
      when p_termo is null or btrim(p_termo) = '' then 0
      when p.busca_normalizada ilike '%' || public.f_normalizar_produto(lower(btrim(p_termo))) || '%' then 1
      else 2
    end,
    word_similarity(public.f_normalizar_produto(lower(btrim(p_termo))), p.busca_normalizada) desc,
    p.nome
  limit p_limit offset p_offset;
$$;

grant execute on function public.produtos_buscar(text, integer, integer) to authenticated;
