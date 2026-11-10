-- Permite ao super admin desativar, pra TODAS as oficinas de uma vez,
-- funcionalidades que dependem de API externa (puxar placa, puxar CEP,
-- puxar CNPJ, puxar CPF, envio automático de WhatsApp) e escolher a mensagem
-- que aparece pra oficina quando a função está desativada. Guardado junto da
-- config global já existente (chave_pix/mensagem_urgencia) — mesma tabela,
-- mesma regra de RLS (todo autenticado lê, só super admin escreve).
alter table public.configuracoes_plataforma
  add column funcionalidades jsonb not null default '{}'::jsonb;

update public.configuracoes_plataforma
set funcionalidades = jsonb_build_object(
  'puxar_placa', jsonb_build_object('ativo', true, 'mensagem', 'Consulta de placa temporariamente indisponível. Fale com o suporte.'),
  'puxar_cep', jsonb_build_object('ativo', true, 'mensagem', 'Busca de CEP temporariamente indisponível. Fale com o suporte.'),
  'puxar_cnpj', jsonb_build_object('ativo', true, 'mensagem', 'Consulta de CNPJ temporariamente indisponível. Fale com o suporte.'),
  'puxar_cpf', jsonb_build_object('ativo', true, 'mensagem', 'Consulta de CPF temporariamente indisponível. Fale com o suporte.'),
  'whatsapp_automatico', jsonb_build_object('ativo', true, 'mensagem', 'Envio automático de WhatsApp temporariamente indisponível. Fale com o suporte.')
)
where id = 'global';
