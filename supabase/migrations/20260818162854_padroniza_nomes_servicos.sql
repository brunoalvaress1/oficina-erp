-- O catalogo de servicos (mao de obra, etc) acumulou nomes em MAIUSCULO,
-- minusculo e Misto (cada mecanico digita do seu jeito), o que deixa a lista
-- inconsistente e cria risco real de duplicata (ex: "TROCA DE OLEO" e "troca
-- de oleo" virarem dois registros por causa so da caixa da letra). Padroniza
-- tudo pro mesmo formato ja usado no resto do app (capitalizarPalavras, em
-- src/utils/format.ts): primeira letra de cada palavra (separada por espaco)
-- maiuscula, resto minusculo.
create or replace function public._capitalizar_palavras(texto text)
returns text
language sql
immutable
as $$
  select string_agg(
    case when palavra = '' then palavra
      else upper(left(palavra, 1)) || lower(substring(palavra from 2))
    end,
    ' '
  )
  from unnest(string_to_array(lower(btrim(texto)), ' ')) as palavra
$$;

update public.servicos
set nome = public._capitalizar_palavras(nome), updated_at = now()
where nome is distinct from public._capitalizar_palavras(nome);

drop function public._capitalizar_palavras(text);

-- Trava duplicidade por maiuscula/minuscula/espacos nas pontas daqui pra
-- frente, direto no banco - mesmo se algum caminho novo (fora do
-- criarServico/atualizarServico da aplicacao, que ja faz essa checagem)
-- esquecer de normalizar antes de gravar.
create unique index servicos_oficina_nome_normalizado_key
  on public.servicos (oficina_id, lower(btrim(nome)));
