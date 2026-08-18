-- Lê a lista de Veículos por essa view (veiculos + nome do cliente já
-- achatado) em vez da tabela + embed `clientes(nome)` usada em
-- buscarVeiculoPorId/atualizarVeiculo/etc. Mesmo motivo já resolvido pra
-- ordens_servico_lista: o PostgREST não ordena a tabela principal por coluna
-- de recurso embutido (só reordena o array aninhado), então clicar em
-- "Cliente" na lista de Veículos nunca mudava a ordem de verdade — a query
-- precisa vir de uma coluna de primeiro nível.
create view public.veiculos_lista
with (security_invoker = true)
as
select
  v.id,
  v.oficina_id,
  v.cliente_id,
  v.placa,
  v.marca,
  v.modelo,
  v.cor,
  v.ano,
  v.ano_modelo,
  v.chassi,
  v.km_atual,
  v.combustivel,
  v.motor,
  v.opcionais,
  v.observacoes,
  v.created_at,
  v.updated_at,
  c.nome as cliente_nome
from public.veiculos v
left join public.clientes c on c.id = v.cliente_id;
