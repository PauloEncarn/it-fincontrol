create table if not exists public.lancamento_eventos (
  id bigserial primary key,
  lancamento_id bigint references public.lancamentos(id) on delete set null,
  tipo text not null,
  titulo text not null,
  descricao text,
  ator_nome text,
  ator_username text,
  origem text not null default 'sistema',
  metadata jsonb not null default '{}'::jsonb,
  antes jsonb,
  depois jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_lancamento_eventos_lancamento
  on public.lancamento_eventos(lancamento_id, created_at desc);

create index if not exists idx_lancamento_eventos_tipo
  on public.lancamento_eventos(tipo);

