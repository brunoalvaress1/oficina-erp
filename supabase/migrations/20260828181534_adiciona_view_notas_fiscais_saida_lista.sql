-- Lê a lista de Notas Fiscais por essa view (notas_fiscais_saida + numero da
-- OS e nome de quem emitiu já achatados) em vez da tabela + embed
-- `ordens_servico(numero)`/`funcionarios(nome)` usada hoje em listarNotasFiscais
-- — mesmo motivo já resolvido antes pra ordens_servico_lista/veiculos_lista:
-- o PostgREST não ordena a tabela principal por coluna de recurso embutido,
-- então clicar em "Cliente"/"OS" pra ordenar a lista de notas emitidas não
-- funcionaria vindo direto de `ordens_servico(numero)`.
create view public.notas_fiscais_saida_lista
with (security_invoker = true)
as
select
  n.*,
  os.numero as ordem_numero,
  f.nome as criado_por_nome
from public.notas_fiscais_saida n
left join public.ordens_servico os on os.id = n.ordem_servico_id
left join public.funcionarios f on f.id = n.criado_por;
