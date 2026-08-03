alter table public.lancamentos
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.lancamento_edicao_locks (
  lancamento_id bigint primary key references public.lancamentos(id) on delete cascade,
  usuario_id text,
  usuario_nome text not null,
  usuario_username text,
  session_id text not null,
  locked_at timestamptz not null default now(),
  heartbeat_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '90 seconds')
);

create index if not exists idx_lancamento_edicao_locks_expires
  on public.lancamento_edicao_locks(expires_at);

create index if not exists idx_lancamentos_updated_at
  on public.lancamentos(updated_at);
