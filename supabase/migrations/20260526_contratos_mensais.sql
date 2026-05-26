create table if not exists public.contratos_mensais (
  id bigserial primary key,
  fornecedor_id bigint references public.fornecedores(id),
  filial_id bigint references public.filiais(id),
  cnpj_usado text,
  contrato_usado text,
  centro_custo_usado text,
  descricao_servico text,
  servico_protheus text,
  valor_base_previsto numeric(14, 2) not null default 0,
  dia_vencimento integer not null default 1 check (dia_vencimento between 1 and 31),
  tolerancia_percentual numeric(6, 2) not null default 5,
  status text not null default 'Ativo' check (status in ('Ativo', 'Pausado', 'Cancelado')),
  data_inicio date not null,
  data_fim date,
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lancamentos
  add column if not exists contrato_id bigint references public.contratos_mensais(id),
  add column if not exists competencia text,
  add column if not exists valor_previsto numeric(14, 2);

create unique index if not exists lancamentos_contrato_competencia_unique
  on public.lancamentos (contrato_id, competencia)
  where contrato_id is not null and competencia is not null;

create index if not exists contratos_mensais_status_idx on public.contratos_mensais(status);
create index if not exists lancamentos_competencia_idx on public.lancamentos(competencia);
