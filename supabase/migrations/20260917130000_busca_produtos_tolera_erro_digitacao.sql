-- A busca por produto (ilike em busca_normalizada, ver migration
-- 20260911150000) já ignora acento, mas ainda exige substring exata — falta
-- uma letra, troca uma letra, ou digita "parecido" e não acha nada. ilike
-- não tem como resolver isso sozinho (índice de substring não é "parecido
-- com"), então essa RPC usa o pg_trgm (já instalado) pra rankear por
-- semelhança de verdade: primeiro quem bate certinho (substring), depois
-- quem é "parecido o suficiente" mesmo com erro de digitação.
--
-- security invoker (padrão) de propósito — roda com a permissão de quem
-- chamou, então a RLS de produtos (isolamento por oficina) continua valendo
-- igual a um select comum, sem precisar duplicar essa regra aqui.
-- Limiar de semelhança escolhido na mão (0,4) em vez do operador `<%`
-- (que dependeria de mudar pg_trgm.word_similarity_threshold — o papel do
-- Supabase usado pelas migrations não tem permissão pra alterar esse
-- parâmetro). word_similarity(...) direto dá o mesmo resultado sem precisar
-- de privilégio nenhum a mais.
-- p_limit é uma trava de segurança (uma busca genérica de 1-2 letras não
-- devolve o catálogo inteiro), não o "tamanho de página" — quem pagina de
-- verdade (tela Produtos, listarProdutos) faz isso por cima com .range() do
-- PostgREST, senão a contagem total pra paginação saía sempre travada no
-- valor desse limite.
create or replace function public.produtos_buscar(p_termo text default '', p_limit integer default 300, p_offset integer default 0)
returns setof public.produtos
language sql
stable
as $$
  select p.*
  from public.produtos p
  where p_termo is null or btrim(p_termo) = ''
     or p.busca_normalizada ilike '%' || public.f_unaccent(lower(btrim(p_termo))) || '%'
     or word_similarity(public.f_unaccent(lower(btrim(p_termo))), p.busca_normalizada) >= 0.4
  order by
    case
      when p_termo is null or btrim(p_termo) = '' then 0
      when p.busca_normalizada ilike '%' || public.f_unaccent(lower(btrim(p_termo))) || '%' then 1
      else 2
    end,
    word_similarity(public.f_unaccent(lower(btrim(p_termo))), p.busca_normalizada) desc,
    p.nome
  limit p_limit offset p_offset;
$$;

grant execute on function public.produtos_buscar(text, integer, integer) to authenticated;
