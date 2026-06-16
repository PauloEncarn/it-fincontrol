create or replace function public.tmp_text_to_array(value text)
returns text[]
language sql
immutable
as $$
  select coalesce(
    array(
      select nullif(btrim(item), '')
      from unnest(regexp_split_to_array(coalesce(value, ''), '\s*(;|\|)\s*')) as item
      where nullif(btrim(item), '') is not null
    ),
    '{}'::text[]
  );
$$;

alter table public.fornecedores
  alter column lista_cnpjs type text[] using public.tmp_text_to_array(lista_cnpjs),
  alter column lista_cnpjs set default '{}'::text[],
  alter column lista_contratos type text[] using public.tmp_text_to_array(lista_contratos),
  alter column lista_contratos set default '{}'::text[],
  alter column lista_centro_custos type text[] using public.tmp_text_to_array(lista_centro_custos),
  alter column lista_centro_custos set default '{}'::text[];

drop function public.tmp_text_to_array(text);
