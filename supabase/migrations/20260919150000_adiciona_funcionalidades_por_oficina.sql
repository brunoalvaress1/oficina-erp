-- Permite ao super admin desativar, POR OFICINA, funcionalidades que
-- dependem de API externa (puxar placa, puxar CEP, puxar CNPJ, puxar CPF,
-- envio automático de WhatsApp) e escolher a mensagem que aparece pra
-- aquela oficina enquanto a função estiver desativada.
--
-- Fica em `oficinas` (não em configuracoes_plataforma, que é global) porque
-- cada oficina tem seu próprio valor — mesmo padrão de bloqueada_motivo,
-- vencimento_mensalidade etc: coluna só editável pelo super admin (via Edge
-- Function com service role), lida pela própria oficina através da mesma
-- RLS que já libera leitura da própria linha de `oficinas`.
alter table public.oficinas
  add column funcionalidades jsonb not null default jsonb_build_object(
    'puxar_placa', jsonb_build_object('ativo', true, 'mensagem', 'Consulta de placa temporariamente indisponível. Fale com o suporte.'),
    'puxar_cep', jsonb_build_object('ativo', true, 'mensagem', 'Busca de CEP temporariamente indisponível. Fale com o suporte.'),
    'puxar_cnpj', jsonb_build_object('ativo', true, 'mensagem', 'Consulta de CNPJ temporariamente indisponível. Fale com o suporte.'),
    'puxar_cpf', jsonb_build_object('ativo', true, 'mensagem', 'Consulta de CPF temporariamente indisponível. Fale com o suporte.'),
    'whatsapp_automatico', jsonb_build_object('ativo', true, 'mensagem', 'Envio automático de WhatsApp temporariamente indisponível. Fale com o suporte.')
  );
