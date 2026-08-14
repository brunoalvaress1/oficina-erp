-- Permite trocar o cliente (cliente_id) de uma OS ainda aberta através de
-- ordem_servico_atualizar_cabecalho, junto dos demais campos do cabeçalho.
-- Motivo: "Trocar dono do veículo" só mudava o cadastro do veículo (dono das
-- PRÓXIMAS OS's daquela placa) e nunca refletia na OS que já estava aberta,
-- confundindo quem esperava que a OS em edição acompanhasse a troca.
create or replace function public.ordem_servico_atualizar_cabecalho(p_ordem_servico_id uuid, p_funcionario_id uuid, p_ip text, p_alteracoes jsonb)
 returns void
 language plpgsql
 security definer
as $function$
declare
  v_old public.ordens_servico%rowtype;
begin
  select * into v_old from public.ordens_servico where id = p_ordem_servico_id;
  if not found then
    raise exception 'ORDEM_NAO_ENCONTRADA';
  end if;

  if p_alteracoes ? 'numeroPrisma' and (p_alteracoes->>'numeroPrisma') is distinct from v_old.numero_prisma then
    update public.ordens_servico set numero_prisma = nullif(p_alteracoes->>'numeroPrisma', '') where id = p_ordem_servico_id;
    insert into public.ordem_servico_historico (ordem_servico_id, funcionario_id, acao, detalhes, ip)
    values (p_ordem_servico_id, p_funcionario_id, 'cabecalho_atualizado',
      jsonb_build_object('campo', 'numeroPrisma', 'de', v_old.numero_prisma, 'para', p_alteracoes->>'numeroPrisma'), p_ip);
  end if;

  if p_alteracoes ? 'mecanicoId' and (nullif(p_alteracoes->>'mecanicoId', ''))::uuid is distinct from v_old.mecanico_id then
    update public.ordens_servico set mecanico_id = nullif(p_alteracoes->>'mecanicoId', '')::uuid where id = p_ordem_servico_id;
    insert into public.ordem_servico_historico (ordem_servico_id, funcionario_id, acao, detalhes, ip)
    values (p_ordem_servico_id, p_funcionario_id, 'cabecalho_atualizado',
      jsonb_build_object('campo', 'mecanicoId', 'de', v_old.mecanico_id, 'para', p_alteracoes->>'mecanicoId'), p_ip);
  end if;

  if p_alteracoes ? 'status' and (p_alteracoes->>'status') is distinct from v_old.status then
    update public.ordens_servico set status = p_alteracoes->>'status' where id = p_ordem_servico_id;
    insert into public.ordem_servico_historico (ordem_servico_id, funcionario_id, acao, detalhes, ip)
    values (p_ordem_servico_id, p_funcionario_id, 'status_alterado',
      jsonb_build_object('de', v_old.status, 'para', p_alteracoes->>'status'), p_ip);

    -- Cancelar uma OS que ainda não foi pro Caixa devolve pro estoque tudo
    -- que já tinha sido baixado pelos itens dela (a baixa acontece assim que
    -- o item é adicionado, não só na finalização).
    if p_alteracoes->>'status' = 'cancelada' then
      perform public.estornar_estoque_ordem_servico(p_ordem_servico_id, p_funcionario_id, 'Estorno por cancelamento');
    end if;
  end if;

  if p_alteracoes ? 'kmAtual' and (p_alteracoes->>'kmAtual')::numeric is distinct from v_old.km_atual then
    update public.ordens_servico set km_atual = (p_alteracoes->>'kmAtual')::numeric where id = p_ordem_servico_id;
    update public.veiculos set km_atual = (p_alteracoes->>'kmAtual')::numeric, updated_at = now() where id = v_old.veiculo_id;
    insert into public.ordem_servico_historico (ordem_servico_id, funcionario_id, acao, detalhes, ip)
    values (p_ordem_servico_id, p_funcionario_id, 'cabecalho_atualizado',
      jsonb_build_object('campo', 'kmAtual', 'de', v_old.km_atual, 'para', (p_alteracoes->>'kmAtual')::numeric), p_ip);
  end if;

  if p_alteracoes ? 'defeitosRelatados' and (p_alteracoes->>'defeitosRelatados') is distinct from v_old.defeitos_relatados then
    update public.ordens_servico set defeitos_relatados = nullif(p_alteracoes->>'defeitosRelatados', '') where id = p_ordem_servico_id;
    insert into public.ordem_servico_historico (ordem_servico_id, funcionario_id, acao, detalhes, ip)
    values (p_ordem_servico_id, p_funcionario_id, 'cabecalho_atualizado',
      jsonb_build_object('campo', 'defeitosRelatados', 'de', v_old.defeitos_relatados, 'para', p_alteracoes->>'defeitosRelatados'), p_ip);
  end if;

  if p_alteracoes ? 'observacoesInternas' and (p_alteracoes->>'observacoesInternas') is distinct from v_old.observacoes_internas then
    update public.ordens_servico set observacoes_internas = nullif(p_alteracoes->>'observacoesInternas', '') where id = p_ordem_servico_id;
    insert into public.ordem_servico_historico (ordem_servico_id, funcionario_id, acao, detalhes, ip)
    values (p_ordem_servico_id, p_funcionario_id, 'cabecalho_atualizado',
      jsonb_build_object('campo', 'observacoesInternas', 'de', v_old.observacoes_internas, 'para', p_alteracoes->>'observacoesInternas'), p_ip);
  end if;

  if p_alteracoes ? 'dataEntrada' and (p_alteracoes->>'dataEntrada')::date is distinct from v_old.data_entrada then
    update public.ordens_servico set data_entrada = (p_alteracoes->>'dataEntrada')::date where id = p_ordem_servico_id;
    insert into public.ordem_servico_historico (ordem_servico_id, funcionario_id, acao, detalhes, ip)
    values (p_ordem_servico_id, p_funcionario_id, 'cabecalho_atualizado',
      jsonb_build_object('campo', 'dataEntrada', 'de', v_old.data_entrada, 'para', (p_alteracoes->>'dataEntrada')::date), p_ip);
  end if;

  if p_alteracoes ? 'clienteId' and (nullif(p_alteracoes->>'clienteId', ''))::uuid is distinct from v_old.cliente_id then
    if not exists (select 1 from public.clientes where id = (p_alteracoes->>'clienteId')::uuid and oficina_id = v_old.oficina_id) then
      raise exception 'CLIENTE_NAO_ENCONTRADO';
    end if;
    update public.ordens_servico set cliente_id = (p_alteracoes->>'clienteId')::uuid where id = p_ordem_servico_id;
    insert into public.ordem_servico_historico (ordem_servico_id, funcionario_id, acao, detalhes, ip)
    values (p_ordem_servico_id, p_funcionario_id, 'cliente_alterado',
      jsonb_build_object(
        'de', (select nome from public.clientes where id = v_old.cliente_id),
        'para', (select nome from public.clientes where id = (p_alteracoes->>'clienteId')::uuid)
      ), p_ip);
  end if;

  update public.ordens_servico set updated_at = now() where id = p_ordem_servico_id;
end;
$function$
