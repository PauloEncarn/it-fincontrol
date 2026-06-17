alter table public.fornecedores
  add column if not exists lista_servicos text[] not null default '{}'::text[],
  add column if not exists lista_produtos_protheus text[] not null default '{}'::text[],
  add column if not exists lista_valores text[] not null default '{}'::text[];
