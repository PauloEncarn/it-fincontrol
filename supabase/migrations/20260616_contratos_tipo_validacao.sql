alter table public.contratos_mensais
  add column if not exists tipo_contrato text not null default 'Recorrente';

alter table public.contratos_mensais
  drop constraint if exists contratos_mensais_tipo_contrato_check;

alter table public.contratos_mensais
  add constraint contratos_mensais_tipo_contrato_check
  check (tipo_contrato in ('Recorrente', 'Avulso'));

create index if not exists idx_contratos_mensais_tipo
  on public.contratos_mensais(tipo_contrato);
