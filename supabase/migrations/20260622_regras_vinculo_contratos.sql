-- Regras manuais para vincular linhas importadas aos contratos recorrentes.
-- Use esta tabela para ensinar ao sistema os casos ambiguos que a regra automatica nao resolve.

create table if not exists public.contrato_vinculo_regras (
  id bigserial primary key,
  contrato_id bigint not null references public.contratos_mensais(id) on delete cascade,
  contrato_importacao text not null,
  filial_codigo text not null,
  fornecedor_importacao text,
  identificador_item_importacao text,
  servico_importacao text,
  servico_protheus_importacao text,
  centro_custo_importacao text,
  dia_vencimento text,
  valor_referencia numeric(14, 2),
  tolerancia_valor_percentual numeric(6, 2) not null default 5,
  prioridade integer not null default 100,
  ativo boolean not null default true,
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.contrato_vinculo_regras
  add column if not exists identificador_item_importacao text;

create index if not exists contrato_vinculo_regras_lookup_idx
  on public.contrato_vinculo_regras (ativo, contrato_importacao, filial_codigo, prioridade desc);

drop index if exists contrato_vinculo_regras_unique_idx;

create unique index contrato_vinculo_regras_unique_idx
  on public.contrato_vinculo_regras (
    contrato_id,
    contrato_importacao,
    filial_codigo,
    coalesce(fornecedor_importacao, ''),
    coalesce(identificador_item_importacao, ''),
    coalesce(servico_importacao, ''),
    coalesce(servico_protheus_importacao, ''),
    coalesce(centro_custo_importacao, ''),
    coalesce(dia_vencimento, '')
  );
