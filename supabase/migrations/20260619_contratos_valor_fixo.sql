-- Move a regra de valor para o contrato.
-- valor_fixo = true: usa valor_base_previsto.
-- valor_fixo = false: novas notas usam o valor da ultima nota do contrato; se nao houver, ficam sem valor.

alter table public.contratos_mensais
  add column if not exists valor_fixo boolean not null default true;

update public.contratos_mensais
set valor_fixo = true
where valor_fixo is null;

drop index if exists public.contratos_mensais_item_unico_idx;

do $$
declare
  duplicados integer;
begin
  select count(*) into duplicados
  from (
    select
      fornecedor_id,
      coalesce(nullif(btrim(contrato_usado), ''), '__sem_contrato__') as contrato_usado_key,
      coalesce(nullif(btrim(cnpj_usado), ''), '__sem_cnpj__') as cnpj_usado_key,
      coalesce(filial_id, -1) as filial_id_key,
      coalesce(nullif(btrim(subcontrato_nome), ''), '__sem_item__') as subcontrato_nome_key,
      coalesce(nullif(btrim(descricao_servico), ''), '__sem_servico__') as descricao_servico_key,
      coalesce(nullif(btrim(produto_protheus), ''), '__sem_produto__') as produto_protheus_key,
      coalesce(nullif(btrim(centro_custo_usado), ''), '__sem_centro__') as centro_custo_usado_key,
      count(*) as total
    from public.contratos_mensais
    group by
      fornecedor_id,
      coalesce(nullif(btrim(contrato_usado), ''), '__sem_contrato__'),
      coalesce(nullif(btrim(cnpj_usado), ''), '__sem_cnpj__'),
      coalesce(filial_id, -1),
      coalesce(nullif(btrim(subcontrato_nome), ''), '__sem_item__'),
      coalesce(nullif(btrim(descricao_servico), ''), '__sem_servico__'),
      coalesce(nullif(btrim(produto_protheus), ''), '__sem_produto__'),
      coalesce(nullif(btrim(centro_custo_usado), ''), '__sem_centro__')
    having count(*) > 1
  ) itens;

  if duplicados > 0 then
    raise exception 'Existem contratos duplicados pela nova regra. Preencha o identificador do item antes de criar o indice unico.';
  end if;
end $$;

create unique index if not exists contratos_mensais_item_unico_idx
  on public.contratos_mensais (
    fornecedor_id,
    coalesce(nullif(btrim(contrato_usado), ''), '__sem_contrato__'),
    coalesce(nullif(btrim(cnpj_usado), ''), '__sem_cnpj__'),
    coalesce(filial_id, -1),
    coalesce(nullif(btrim(subcontrato_nome), ''), '__sem_item__'),
    coalesce(nullif(btrim(descricao_servico), ''), '__sem_servico__'),
    coalesce(nullif(btrim(produto_protheus), ''), '__sem_produto__'),
    coalesce(nullif(btrim(centro_custo_usado), ''), '__sem_centro__')
  );
