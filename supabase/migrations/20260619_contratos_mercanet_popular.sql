-- Popula/atualiza contratos recorrentes da MERCANET.
-- O identificador do item separa contratos com mesmo numero, filial e servico parecido.

alter table public.contratos_mensais
  add column if not exists valor_fixo boolean not null default true;

do $$
declare
  mercanet_id bigint;
  filial_cicopal_id bigint;
  filial_gopa_id bigint;
  contrato_id bigint;
  item record;
begin
  select id into mercanet_id
  from public.fornecedores
  where upper(btrim(nome_empresa)) = 'MERCANET'
  order by id
  limit 1;

  if mercanet_id is null then
    raise exception 'Fornecedor MERCANET nao encontrado.';
  end if;

  select id into filial_cicopal_id
  from public.filiais
  where codigo = '010101'
  order by id
  limit 1;

  if filial_cicopal_id is null then
    raise exception 'Filial CICOPAL MATRIZ codigo 010101 nao encontrada.';
  end if;

  select id into filial_gopa_id
  from public.filiais
  where codigo = '200101'
  order by id
  limit 1;

  if filial_gopa_id is null then
    raise exception 'Filial GOPA BEBIDAS MATRIZ codigo 200101 nao encontrada.';
  end if;

  update public.fornecedores
  set
    lista_contratos = array(
      select distinct valor
      from unnest(coalesce(lista_contratos, '{}'::text[]) || array['201232', '1000007']::text[]) as itens(valor)
      where nullif(btrim(valor), '') is not null
      order by valor
    ),
    lista_centro_custos = array(
      select distinct valor
      from unnest(coalesce(lista_centro_custos, '{}'::text[]) || array['30102']::text[]) as itens(valor)
      where nullif(btrim(valor), '') is not null
      order by valor
    ),
    lista_servicos = array(
      select distinct valor
      from unnest(coalesce(lista_servicos, '{}'::text[]) || array[
        '1.07 CONTRATO MERCANET SAAS',
        'CONTRATO MERCANET Promotores',
        '1.06 CONSULTORIA MERCANET',
        'COPIA APLICATIVO MOBILE',
        'CONTRATO MERCANET SAAS'
      ]::text[]) as itens(valor)
      where nullif(btrim(valor), '') is not null
      order by valor
    ),
    lista_produtos_protheus = array(
      select distinct valor
      from unnest(coalesce(lista_produtos_protheus, '{}'::text[]) || array[
        '13010021 - SERVICO DE MANUTENCAO DE SOFTWARE',
        '13010009 - SERVICO DE MANUTENCAO DE SOFTWARE'
      ]::text[]) as itens(valor)
      where nullif(btrim(valor), '') is not null
      order by valor
    )
  where id = mercanet_id;

  update public.contratos_mensais
  set subcontrato_nome = descricao_servico,
      nome_contrato = coalesce(nullif(btrim(nome_contrato), ''), descricao_servico),
      updated_at = now()
  where fornecedor_id = mercanet_id
    and nullif(btrim(subcontrato_nome), '') is null
    and filial_id in (filial_cicopal_id, filial_gopa_id)
    and contrato_usado in ('201232', '1000007')
    and descricao_servico in (
      '1.07 CONTRATO MERCANET SAAS',
      'CONTRATO MERCANET Promotores',
      '1.06 CONSULTORIA MERCANET',
      'COPIA APLICATIVO MOBILE',
      'CONTRATO MERCANET SAAS'
    );

  for item in
    select *
    from (
      values
        (
          filial_cicopal_id,
          '201232',
          '1.07 CONTRATO MERCANET SAAS',
          '1.07 CONTRATO MERCANET SAAS',
          '30102',
          '1.07 CONTRATO MERCANET SAAS',
          '13010021 - SERVICO DE MANUTENCAO DE SOFTWARE',
          true,
          13962.00::numeric(14, 2),
          15,
          'CICOPAL MATRIZ (010101). Vencimento: todo dia 15.'
        ),
        (
          filial_cicopal_id,
          '201232',
          'CONTRATO MERCANET Promotores',
          'CONTRATO MERCANET Promotores',
          '30102',
          'CONTRATO MERCANET Promotores',
          '13010021 - SERVICO DE MANUTENCAO DE SOFTWARE',
          true,
          6442.00::numeric(14, 2),
          20,
          'CICOPAL MATRIZ (010101). Vencimento: todo dia 20.'
        ),
        (
          filial_cicopal_id,
          '201232',
          '1.06 CONSULTORIA MERCANET',
          '1.06 CONSULTORIA MERCANET',
          '30102',
          '1.06 CONSULTORIA MERCANET',
          '13010009 - SERVICO DE MANUTENCAO DE SOFTWARE',
          true,
          1045.76::numeric(14, 2),
          1,
          'CICOPAL MATRIZ (010101). Vencimento variavel.'
        ),
        (
          filial_cicopal_id,
          '201232',
          'COPIA APLICATIVO MOBILE',
          'COPIA APLICATIVO MOBILE',
          '30102',
          'COPIA APLICATIVO MOBILE',
          '13010009 - SERVICO DE MANUTENCAO DE SOFTWARE',
          true,
          0.00::numeric(14, 2),
          1,
          'CICOPAL MATRIZ (010101). Sem vencimento fixo informado.'
        ),
        (
          filial_gopa_id,
          '1000007',
          'CONTRATO MERCANET SAAS - GOPA',
          'CONTRATO MERCANET SAAS',
          '30102',
          'CONTRATO MERCANET SAAS',
          '13010009 - SERVICO DE MANUTENCAO DE SOFTWARE',
          true,
          8471.00::numeric(14, 2),
          20,
          'GOPA BEBIDAS MATRIZ (200101). Vencimento: todo dia 20.'
        )
    ) as dados(
      filial_id,
      contrato_usado,
      subcontrato_nome,
      nome_contrato,
      centro_custo_usado,
      descricao_servico,
      produto_protheus,
      valor_fixo,
      valor_base_previsto,
      dia_vencimento,
      observacao
    )
  loop
    select id into contrato_id
    from public.contratos_mensais
    where fornecedor_id = mercanet_id
      and filial_id = item.filial_id
      and contrato_usado = item.contrato_usado
      and subcontrato_nome = item.subcontrato_nome
      and descricao_servico = item.descricao_servico
      and produto_protheus = item.produto_protheus
      and centro_custo_usado = item.centro_custo_usado
    order by id
    limit 1;

    if contrato_id is null then
      insert into public.contratos_mensais (
        fornecedor_id,
        filial_id,
        tipo_contrato,
        contrato_usado,
        nome_contrato,
        subcontrato_nome,
        centro_custo_usado,
        descricao_servico,
        servico_protheus,
        produto_protheus,
        valor_fixo,
        valor_base_previsto,
        dia_vencimento,
        status,
        data_inicio,
        observacao
      )
      values (
        mercanet_id,
        item.filial_id,
        'Recorrente',
        item.contrato_usado,
        item.nome_contrato,
        item.subcontrato_nome,
        item.centro_custo_usado,
        item.descricao_servico,
        item.produto_protheus,
        item.produto_protheus,
        item.valor_fixo,
        item.valor_base_previsto,
        item.dia_vencimento,
        'Ativo',
        current_date,
        item.observacao
      );
    else
      update public.contratos_mensais
      set
        nome_contrato = item.nome_contrato,
        centro_custo_usado = item.centro_custo_usado,
        descricao_servico = item.descricao_servico,
        servico_protheus = item.produto_protheus,
        produto_protheus = item.produto_protheus,
        valor_fixo = item.valor_fixo,
        valor_base_previsto = item.valor_base_previsto,
        dia_vencimento = item.dia_vencimento,
        status = 'Ativo',
        data_inicio = coalesce(data_inicio, current_date),
        observacao = item.observacao,
        updated_at = now()
      where id = contrato_id;
    end if;
  end loop;
end $$;
