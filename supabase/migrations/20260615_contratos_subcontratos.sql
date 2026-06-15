alter table public.contratos_mensais
  add column if not exists nome_contrato text,
  add column if not exists subcontrato_nome text,
  add column if not exists produto_protheus text,
  add column if not exists detalhe text,
  add column if not exists fluxo_lancamento text not null default 'manual',
  add column if not exists email_destino text,
  add column if not exists responsavel_interno text,
  add column if not exists regra_lancamento text;

create index if not exists idx_contratos_mensais_fornecedor_contrato
  on public.contratos_mensais(fornecedor_id, contrato_usado);

create index if not exists idx_contratos_mensais_fluxo
  on public.contratos_mensais(fluxo_lancamento);

