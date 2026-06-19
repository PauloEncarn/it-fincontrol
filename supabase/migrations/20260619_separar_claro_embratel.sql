-- Corrige cadastro do fornecedor CLARO e separa contratos que estavam misturados
-- em CLARO / EMBRATEL.

create sequence if not exists public.fornecedores_id_seq;

alter sequence public.fornecedores_id_seq owned by public.fornecedores.id;

alter table public.fornecedores
  alter column id set default nextval('public.fornecedores_id_seq'::regclass);

select setval(
  'public.fornecedores_id_seq'::regclass,
  coalesce((select max(id) from public.fornecedores), 0) + 1,
  false
);

do $$
declare
  claro_id bigint;
  embratel_id bigint;
  vivo_id bigint;
begin
  select id into claro_id
  from public.fornecedores
  where upper(btrim(nome_empresa)) = 'CLARO'
  order by id
  limit 1;

  if claro_id is null then
    insert into public.fornecedores (
      nome_empresa,
      lista_cnpjs,
      lista_contratos,
      lista_centro_custos,
      lista_servicos,
      lista_produtos_protheus,
      lista_valores,
      padrao_descricao_servico,
      padrao_servico_protheus
    )
    values (
      'CLARO',
      array['40.432.544/0001-47', '40.432.544/0436-28']::text[],
      array['200425', '201182']::text[],
      array['20301']::text[],
      array['TELEFONIA']::text[],
      array['13010007 - SERVICO DE TELEFONIA']::text[],
      '{}'::text[],
      'TELEFONIA',
      '13010007 - SERVICO DE TELEFONIA'
    )
    returning id into claro_id;
  end if;

  select id into embratel_id
  from public.fornecedores
  where upper(btrim(nome_empresa)) in ('CLARO / EMBRATEL', 'EMBRATEL')
  order by id
  limit 1;

  select id into vivo_id
  from public.fornecedores
  where upper(btrim(nome_empresa)) = 'VIVO / TELEFONICA'
  order by id
  limit 1;

  update public.fornecedores
  set
    lista_cnpjs = array(
      select distinct item
      from unnest(coalesce(lista_cnpjs, '{}'::text[]) || array['40.432.544/0001-47', '40.432.544/0436-28']::text[]) item
      where nullif(btrim(item), '') is not null
      order by item
    ),
    lista_contratos = array(
      select distinct item
      from unnest(coalesce(lista_contratos, '{}'::text[]) || array['200425', '201182']::text[]) item
      where nullif(btrim(item), '') is not null
      order by item
    ),
    lista_centro_custos = array(
      select distinct item
      from unnest(coalesce(lista_centro_custos, '{}'::text[]) || array['20301']::text[]) item
      where nullif(btrim(item), '') is not null
      order by item
    ),
    lista_servicos = array(
      select distinct item
      from unnest(coalesce(lista_servicos, '{}'::text[]) || array['TELEFONIA']::text[]) item
      where nullif(btrim(item), '') is not null
      order by item
    ),
    lista_produtos_protheus = array(
      select distinct item
      from unnest(coalesce(lista_produtos_protheus, '{}'::text[]) || array['13010007 - SERVICO DE TELEFONIA']::text[]) item
      where nullif(btrim(item), '') is not null
      order by item
    ),
    padrao_descricao_servico = 'TELEFONIA',
    padrao_servico_protheus = '13010007 - SERVICO DE TELEFONIA'
  where id = claro_id;

  if embratel_id is not null then
    update public.fornecedores
    set nome_empresa = 'EMBRATEL'
    where id = embratel_id;

    update public.contratos_mensais
    set fornecedor_id = claro_id,
        updated_at = now()
    where fornecedor_id = embratel_id
      and coalesce(contrato_usado, '') not in ('200544', '201092');

    update public.lancamentos
    set fornecedor_id = claro_id
    where fornecedor_id = embratel_id
      and coalesce(contrato_usado, '') not in ('200544', '201092');

    update public.fornecedores
    set lista_contratos = array['200544', '201092']::text[]
    where id = embratel_id;
  end if;

  if vivo_id is not null then
    update public.contratos_mensais
    set fornecedor_id = claro_id,
        updated_at = now()
    where fornecedor_id = vivo_id
      and (
        contrato_usado in ('200425', '201182')
        or nome_contrato in ('200425', '201182')
      );

    update public.lancamentos
    set fornecedor_id = claro_id
    where fornecedor_id = vivo_id
      and contrato_usado in ('200425', '201182');

    update public.fornecedores
    set lista_contratos = array(
      select item
      from unnest(coalesce(lista_contratos, '{}'::text[])) item
      where item not in ('200425', '201182')
      order by item
    )
    where id = vivo_id;
  end if;

  update public.fornecedores
  set lista_contratos = array(
    select distinct item
    from (
      select unnest(coalesce(lista_contratos, '{}'::text[])) as item
      union all
      select contrato_usado
      from public.contratos_mensais
      where fornecedor_id = claro_id
      union all
      select contrato_usado
      from public.lancamentos
      where fornecedor_id = claro_id
    ) contratos
    where nullif(btrim(item), '') is not null
      and btrim(item) <> '-'
    order by item
  )
  where id = claro_id;
end $$;
