-- Buscar "205/55r15" também trazia "205/55r16" (e outras medidas) na lista,
-- porque a busca "parecida" (fuzzy/word_similarity) sempre rodava JUNTO com
-- a busca exata — e pra medida de pneu, um número de diferença é o
-- suficiente pro texto parecer "parecido" (a maior parte da string é igual),
-- mas é um pneu completamente diferente, não intercambiável.
--
-- Agora a busca "parecida" só entra em ação quando a busca EXATA (ilike) não
-- encontrou nada — é o comportamento normal de campo de busca (tenta certo
-- primeiro, só tenta "parecido" se não achou nada certinho), em vez de
-- misturar os dois sempre.
create or replace function public.produtos_buscar(p_termo text default '', p_limit integer default 300, p_offset integer default 0)
returns setof public.produtos
language plpgsql
stable
as $$
declare
  v_termo text := public.f_normalizar_produto(lower(btrim(coalesce(p_termo, ''))));
  v_tem_exato boolean;
begin
  if v_termo = '' then
    return query
      select p.* from public.produtos p
      order by p.nome
      limit p_limit offset p_offset;
    return;
  end if;

  select exists(
    select 1 from public.produtos p where p.busca_normalizada ilike '%' || v_termo || '%'
  ) into v_tem_exato;

  if v_tem_exato then
    return query
      select p.* from public.produtos p
      where p.busca_normalizada ilike '%' || v_termo || '%'
      order by p.nome
      limit p_limit offset p_offset;
  else
    -- Só cai aqui quando não achou NADA certinho — aí sim vale tolerar erro
    -- de digitação (ex: "amortcedor" sem achar substring nenhuma).
    return query
      select p.* from public.produtos p
      where word_similarity(v_termo, p.busca_normalizada) >= 0.4
      order by word_similarity(v_termo, p.busca_normalizada) desc, p.nome
      limit p_limit offset p_offset;
  end if;
end;
$$;

grant execute on function public.produtos_buscar(text, integer, integer) to authenticated;
