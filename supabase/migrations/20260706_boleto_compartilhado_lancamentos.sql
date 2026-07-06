alter table public.lancamentos
  add column if not exists boleto_grupo text,
  add column if not exists valor_boleto numeric(14, 2),
  add column if not exists observacao_boleto text;

create index if not exists lancamentos_boleto_grupo_idx
  on public.lancamentos (boleto_grupo)
  where boleto_grupo is not null;
