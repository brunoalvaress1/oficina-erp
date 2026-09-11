-- Busca de produto (Ordem de Serviço, lançar/editar nota de estoque,
-- movimento de estoque, tela Produtos) usava .ilike() direto nas colunas —
-- ilike já ignora maiúscula/minúscula sozinho, mas NÃO ignora acento, então
-- digitar "oleo" sem acento não achava um produto cadastrado como "Óleo".
--
-- Solução: coluna gerada `busca_normalizada` (nome+categoria+subcategoria+
-- marca+códigos, tudo em minúsculo e sem acento) — o filtro passa a comparar
-- contra ela, e o termo digitado é normalizado do mesmo jeito no frontend
-- antes de mandar pro ilike (ver removerAcentos em src/utils/format.ts).
create extension if not exists unaccent with schema public;

-- unaccent(text) "sozinho" é STABLE (depende do dicionário resolvido em
-- tempo de execução), o que o Postgres recusa dentro de uma coluna GERADA
-- (exige IMMUTABLE). Essa forma de 2 argumentos, citando o dicionário pelo
-- nome, é o jeito padrão de contornar isso sem abrir mão de continuar sendo
-- 100% determinístico pro nosso caso.
create or replace function public.f_unaccent(texto text)
returns text
language sql
immutable
parallel safe
as $$
  select public.unaccent('public.unaccent', coalesce(texto, ''))
$$;

alter table public.produtos
  add column if not exists busca_normalizada text
  generated always as (
    public.f_unaccent(lower(
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

-- gin_trgm_ops (pg_trgm, já instalado) acelera ilike '%termo%' em qualquer
-- posição do texto — sem isso a busca faz varredura completa da tabela toda
-- vez.
create index if not exists produtos_busca_normalizada_trgm_idx
  on public.produtos using gin (busca_normalizada gin_trgm_ops);
