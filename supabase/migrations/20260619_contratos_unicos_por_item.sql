-- Garante que cada item de contrato cadastrado para um fornecedor seja unico.
-- O mesmo numero de contrato pode existir para filial/servico/item diferentes,
-- mas a mesma combinacao nao pode se repetir.

do $$
declare
  conflitos text;
begin
  select string_agg(
    format(
      'fornecedor_id=%s, contrato=%s, filial_id=%s, item=%s, servico=%s, produto=%s, centro_custo=%s, ids=%s',
      fornecedor_id,
      contrato_usado,
      coalesce(filial_id::text, '-'),
      coalesce(nullif(trim(subcontrato_nome), ''), '-'),
      coalesce(nullif(trim(descricao_servico), ''), '-'),
      coalesce(nullif(trim(produto_protheus), ''), '-'),
      coalesce(nullif(trim(centro_custo_usado), ''), '-'),
      ids
    ),
    E'\n'
  )
  into conflitos
  from (
    select
      fornecedor_id,
      min(contrato_usado) as contrato_usado,
      nullif(min(coalesce(filial_id, -1)), -1) as filial_id,
      min(nullif(trim(subcontrato_nome), '')) as subcontrato_nome,
      min(nullif(trim(descricao_servico), '')) as descricao_servico,
      min(nullif(trim(produto_protheus), '')) as produto_protheus,
      min(nullif(trim(centro_custo_usado), '')) as centro_custo_usado,
      array_agg(id order by id) as ids,
      count(*) as total
    from public.contratos_mensais
    where fornecedor_id is not null
      and nullif(trim(contrato_usado), '') is not null
    group by
      fornecedor_id,
      lower(trim(contrato_usado)),
      coalesce(filial_id, -1),
      lower(trim(coalesce(subcontrato_nome, ''))),
      lower(trim(coalesce(descricao_servico, ''))),
      lower(trim(coalesce(produto_protheus, ''))),
      lower(trim(coalesce(centro_custo_usado, '')))
    having count(*) > 1
  ) duplicados;

  if conflitos is not null then
    raise exception 'Existem contratos duplicados. Ajuste antes de aplicar o indice unico:%', E'\n' || conflitos;
  end if;
end $$;

create unique index if not exists contratos_mensais_item_unico_idx
  on public.contratos_mensais (
    fornecedor_id,
    lower(trim(contrato_usado)),
    coalesce(filial_id, -1),
    lower(trim(coalesce(subcontrato_nome, ''))),
    lower(trim(coalesce(descricao_servico, ''))),
    lower(trim(coalesce(produto_protheus, ''))),
    lower(trim(coalesce(centro_custo_usado, '')))
  )
  where fornecedor_id is not null
    and nullif(trim(contrato_usado), '') is not null;
