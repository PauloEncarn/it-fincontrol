alter table public.fornecedores
  add column if not exists padrao_descricao_servico text,
  add column if not exists padrao_servico_protheus text,
  add column if not exists lista_servicos text[] not null default '{}'::text[],
  add column if not exists lista_produtos_protheus text[] not null default '{}'::text[],
  add column if not exists lista_valores text[] not null default '{}'::text[];

alter table public.contratos_mensais
  add column if not exists produto_protheus text;

alter table public.lancamentos
  add column if not exists valor_previsto numeric(14, 2);

create or replace function public.tmp_catalog_text_to_array(value text)
returns text[]
language sql
immutable
as $$
  select coalesce(
    array(
      select distinct nullif(btrim(item), '')
      from unnest(regexp_split_to_array(coalesce(value, ''), '\s*(;|\|)\s*')) as item
      where nullif(btrim(item), '') is not null
        and nullif(btrim(item), '') <> '-'
      order by nullif(btrim(item), '')
    ),
    '{}'::text[]
  );
$$;

with catalogos as (
  select
    f.id,
    array(
      select distinct item
      from (
        select unnest(coalesce(f.lista_contratos, '{}'::text[])) as item
        union all
        select unnest(public.tmp_catalog_text_to_array(cm.contrato_usado)) as item
        from public.contratos_mensais cm
        where cm.fornecedor_id = f.id
        union all
        select unnest(public.tmp_catalog_text_to_array(l.contrato_usado)) as item
        from public.lancamentos l
        where l.fornecedor_id = f.id
      ) contratos
      where nullif(btrim(item), '') is not null
        and nullif(btrim(item), '') <> '-'
      order by item
    ) as lista_contratos,
    array(
      select distinct item
      from (
        select unnest(coalesce(f.lista_centro_custos, '{}'::text[])) as item
        union all
        select unnest(public.tmp_catalog_text_to_array(cm.centro_custo_usado)) as item
        from public.contratos_mensais cm
        where cm.fornecedor_id = f.id
        union all
        select unnest(public.tmp_catalog_text_to_array(l.centro_custo_usado)) as item
        from public.lancamentos l
        where l.fornecedor_id = f.id
      ) centros
      where nullif(btrim(item), '') is not null
        and nullif(btrim(item), '') <> '-'
      order by item
    ) as lista_centro_custos,
    array(
      select distinct item
      from (
        select unnest(coalesce(f.lista_servicos, '{}'::text[])) as item
        union all
        select unnest(public.tmp_catalog_text_to_array(f.padrao_descricao_servico)) as item
        union all
        select unnest(public.tmp_catalog_text_to_array(cm.descricao_servico)) as item
        from public.contratos_mensais cm
        where cm.fornecedor_id = f.id
        union all
        select unnest(public.tmp_catalog_text_to_array(l.descricao_servico)) as item
        from public.lancamentos l
        where l.fornecedor_id = f.id
      ) servicos
      where nullif(btrim(item), '') is not null
        and nullif(btrim(item), '') <> '-'
      order by item
    ) as lista_servicos,
    array(
      select distinct item
      from (
        select unnest(coalesce(f.lista_produtos_protheus, '{}'::text[])) as item
        union all
        select unnest(public.tmp_catalog_text_to_array(f.padrao_servico_protheus)) as item
        union all
        select unnest(public.tmp_catalog_text_to_array(cm.produto_protheus)) as item
        from public.contratos_mensais cm
        where cm.fornecedor_id = f.id
        union all
        select unnest(public.tmp_catalog_text_to_array(cm.servico_protheus)) as item
        from public.contratos_mensais cm
        where cm.fornecedor_id = f.id
        union all
        select unnest(public.tmp_catalog_text_to_array(l.servico_protheus)) as item
        from public.lancamentos l
        where l.fornecedor_id = f.id
      ) produtos
      where nullif(btrim(item), '') is not null
        and nullif(btrim(item), '') <> '-'
      order by item
    ) as lista_produtos_protheus,
    array(
      select distinct item
      from (
        select unnest(coalesce(f.lista_valores, '{}'::text[])) as item
        union all
        select item
        from (
          select item, count(*) as repeticoes
          from (
            select replace(to_char(cm.valor_base_previsto, 'FM999999999990.00'), '.', ',') as item
            from public.contratos_mensais cm
            where cm.fornecedor_id = f.id
              and coalesce(cm.valor_base_previsto, 0) > 0
            union all
            select replace(to_char(l.valor_previsto, 'FM999999999990.00'), '.', ',') as item
            from public.lancamentos l
            where l.fornecedor_id = f.id
              and coalesce(l.valor_previsto, 0) > 0
            union all
            select replace(to_char(l.valor, 'FM999999999990.00'), '.', ',') as item
            from public.lancamentos l
            where l.fornecedor_id = f.id
              and coalesce(l.valor, 0) > 0
          ) valores_historicos
          group by item
        ) valores_recorrentes
        where repeticoes > 1
      ) valores
      where nullif(btrim(item), '') is not null
        and nullif(btrim(item), '') <> '-'
      order by item
    ) as lista_valores
  from public.fornecedores f
)
update public.fornecedores f
set
  lista_contratos = coalesce(c.lista_contratos, '{}'::text[]),
  lista_centro_custos = coalesce(c.lista_centro_custos, '{}'::text[]),
  lista_servicos = coalesce(c.lista_servicos, '{}'::text[]),
  lista_produtos_protheus = coalesce(c.lista_produtos_protheus, '{}'::text[]),
  lista_valores = coalesce(c.lista_valores, '{}'::text[])
from catalogos c
where c.id = f.id;

with valores_csv (nome_empresa, valores) as (
  values
    ('AGIS EQUIP. E SERV INFORMATICA', array['6629,60', '5006,18', '1451,40', '3490,00']::text[]),
    ('ALGAR TELECOM', array['620,00', '713,56', '710,26', '1566,93', '1500,00', '1332,01', '2245,64', '470,00', '740,77', '741,81']::text[]),
    ('CLARO / EMBRATEL', array['128,66', '32,99', '115,28', '59,90', '96,90', '125,00', '89,90', '340,53', '16,62', '274,85', '179,26', '1440,78', '180,00', '951,50', '185,92', '16,25']::text[]),
    ('CONTROLLER', array['3164,00', '1104,41', '1442,12']::text[]),
    ('DIRECTCALL', array['316,00', '44,00']::text[]),
    ('DOWNUP', array['1800,00']::text[]),
    ('DSX IT SOLUTIONS', array['500,00']::text[]),
    ('G7 TECNOLOGIA', array['2499,49', '4600,00']::text[]),
    ('INGRAM MICRO', array['1750,84', '1312,64', '1202,55', '1294,41']::text[]),
    ('ITS TELECOMUNICACOES', array['1500,00']::text[]),
    ('IZATECH', array['1380,55']::text[]),
    ('LG INFORMATICA', array['22453,60', '1231,20', '1740,40']::text[]),
    ('LOCAWEB', array['458,99', '228,00', '230,99']::text[]),
    ('MERCANET', array['6442,00', '8471,00', '13962,00', '8093,00', '12874,00', '1285,50', '13365,98', '6252,22', '2746,30', '2220,42']::text[]),
    ('NEOGRID', array['186,63', '5299,90', '2581,97', '448,71', '1271,74', '1478,33', '1523,18']::text[]),
    ('ONLINE NORTE', array['1000,00']::text[]),
    ('ONNET TELECOMUNICACOES', array['2700,00']::text[]),
    ('PCM SOLUCOES', array['550,00', '400,00']::text[]),
    ('SCANSOURCE', array['1537,76', '1537,70', '931,20', '1537,75']::text[]),
    ('TD SYNNEX', array['8895,00', '1257,30']::text[]),
    ('TIM', array['119,99', '109,99']::text[]),
    ('TOTVS', array['1034,66', '3311,64', '953,94', '10479,62', '3134,50', '1012,54', '10294,44', '1432,50', '1016,36', '34666,40', '1458,17', '3312,53', '36100,94', '34686,90', '3190,88', '35310,95', '966,78', '3253,00', '4090,60', '1518,58']::text[]),
    ('VIVO / TELEFONICA', array['1408,05', '203,02', '4631,30', '4485,42', '1852,52', '1149,84', '1113,84', '1142,64', '6541,48', '1334,58', '1299,48', '4279,96', '4149,64', '574,92', '556,92', '570,42', '121,59', '696,20', '638,80', '115,15']::text[]),
    ('WBRNET INTERNET', array['2500,00']::text[])
)
update public.fornecedores f
set lista_valores = (
  select coalesce(array_agg(distinct valor order by valor), '{}'::text[])
  from unnest(coalesce(f.lista_valores, '{}'::text[]) || v.valores) as valor
  where nullif(btrim(valor), '') is not null
    and nullif(btrim(valor), '') <> '-'
)
from valores_csv v
where f.nome_empresa = v.nome_empresa;

drop function public.tmp_catalog_text_to_array(text);
