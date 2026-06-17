-- Ativa e completa contratos mensais usando apenas evidencias recorrentes
-- ja importadas em lancamentos.
--
-- Regras desta carga:
-- - normaliza filiais para codigo com 6 digitos, preservando zero a esquerda;
-- - unifica filiais duplicadas pelo codigo normalizado;
-- - vincula lancamentos e contratos aos seus contratos/filiais quando ha evidencia;
-- - usa a competencia 2026-05 como referencia para decidir contratos ativos;
-- - preenche valor previsto e dia de vencimento somente quando ha padrao dominante.

update public.filiais
set codigo = lpad(regexp_replace(coalesce(codigo, ''), '\D', '', 'g'), 6, '0')
where codigo is not null
  and codigo <> lpad(regexp_replace(coalesce(codigo, ''), '\D', '', 'g'), 6, '0');

with duplicadas as (
  select
    id,
    first_value(id) over (partition by codigo order by id) as filial_canonica_id
  from public.filiais
  where nullif(codigo, '') is not null
),
para_unificar as (
  select id, filial_canonica_id
  from duplicadas
  where id <> filial_canonica_id
)
update public.lancamentos l
set filial_id = p.filial_canonica_id
from para_unificar p
where l.filial_id = p.id;

with duplicadas as (
  select
    id,
    first_value(id) over (partition by codigo order by id) as filial_canonica_id
  from public.filiais
  where nullif(codigo, '') is not null
),
para_unificar as (
  select id, filial_canonica_id
  from duplicadas
  where id <> filial_canonica_id
)
update public.contratos_mensais cm
set filial_id = p.filial_canonica_id
from para_unificar p
where cm.filial_id = p.id;

do $$
begin
  if to_regclass('public.solicitacoes') is not null then
    execute $sql$
      with duplicadas as (
        select
          id,
          first_value(id) over (partition by codigo order by id) as filial_canonica_id
        from public.filiais
        where nullif(codigo, '') is not null
      ),
      para_unificar as (
        select id, filial_canonica_id
        from duplicadas
        where id <> filial_canonica_id
      )
      update public.solicitacoes s
      set filial_id = p.filial_canonica_id
      from para_unificar p
      where s.filial_id = p.id
    $sql$;
  end if;
end $$;

with duplicadas as (
  select
    id,
    row_number() over (partition by codigo order by id) as ordem
  from public.filiais
  where nullif(codigo, '') is not null
)
delete from public.filiais f
using duplicadas d
where f.id = d.id
  and d.ordem > 1;

create unique index if not exists filiais_codigo_unique
  on public.filiais (codigo)
  where codigo is not null;

with contratos_resolvidos as (
  select
    l.id as lancamento_id,
    contrato.id as contrato_id
  from public.lancamentos l
  join public.fornecedores f
    on f.id = l.fornecedor_id
  left join lateral (
    select cm.id
    from public.contratos_mensais cm
    where cm.fornecedor_id = f.id
      and (
        cm.contrato_usado = l.contrato_usado
        or (
          cm.contrato_usado is not null
          and cm.contrato_usado = any(regexp_split_to_array(coalesce(l.contrato_usado, ''), '\s*(/|\||-)\s*'))
        )
      )
    order by
      case when cm.centro_custo_usado = l.centro_custo_usado then 0 else 1 end,
      case when cm.contrato_usado = l.contrato_usado then 0 else 1 end,
      cm.id desc
    limit 1
  ) contrato on true
  where l.contrato_id is null
    and nullif(l.contrato_usado, '') is not null
    and contrato.id is not null
)
update public.lancamentos l
set contrato_id = cr.contrato_id
from contratos_resolvidos cr
where l.id = cr.lancamento_id;

with filial_por_lancamento as (
  select
    l.id as lancamento_id,
    fl.id as filial_id
  from public.lancamentos l
  join public.fornecedores f
    on f.id = l.fornecedor_id
  join public.filiais fl
    on fl.codigo = '010401'
  where l.filial_id is null
    and (
      (f.nome_empresa = 'DIRECTCALL' and l.contrato_usado = '201127')
      or (f.nome_empresa = 'DOWNUP' and l.contrato_usado = '201131')
      or (f.nome_empresa = 'ITS TELECOMUNICACOES' and l.contrato_usado = '201130')
    )
)
update public.lancamentos l
set filial_id = fpl.filial_id
from filial_por_lancamento fpl
where l.id = fpl.lancamento_id;

with filial_por_contrato as (
  select distinct on (l.contrato_id)
    l.contrato_id,
    l.filial_id
  from public.lancamentos l
  where l.contrato_id is not null
    and l.filial_id is not null
  group by l.contrato_id, l.filial_id
  order by l.contrato_id, count(*) desc, max(l.competencia) desc, l.filial_id
)
update public.contratos_mensais cm
set
  filial_id = fpc.filial_id,
  updated_at = now()
from filial_por_contrato fpc
where cm.id = fpc.contrato_id
  and cm.filial_id is distinct from fpc.filial_id;

with filial_010401 as (
  select id
  from public.filiais
  where codigo = '010401'
  order by id
  limit 1
),
contratos_010401 as (
  select cm.id as contrato_id, fl.id as filial_id
  from public.contratos_mensais cm
  join public.fornecedores f
    on f.id = cm.fornecedor_id
  cross join filial_010401 fl
  where (f.nome_empresa = 'DIRECTCALL' and cm.contrato_usado = '201127')
     or (f.nome_empresa = 'DOWNUP' and cm.contrato_usado = '201131')
     or (f.nome_empresa = 'ITS TELECOMUNICACOES' and cm.contrato_usado = '201130')
)
update public.contratos_mensais cm
set
  filial_id = c.filial_id,
  updated_at = now()
from contratos_010401 c
where cm.id = c.contrato_id
  and cm.filial_id is distinct from c.filial_id;

with lancamentos_validos as (
  select
    l.contrato_id,
    l.filial_id,
    l.competencia,
    to_date(l.competencia || '-01', 'YYYY-MM-DD') as competencia_data,
    l.valor,
    extract(day from l.data_vencimento)::int as dia_vencimento
  from public.lancamentos l
  where l.contrato_id is not null
    and l.competencia ~ '^[0-9]{4}-[0-9]{2}$'
    and l.valor is not null
    and l.valor > 0
    and l.data_vencimento is not null
),
janela as (
  select date '2026-05-01' as competencia_referencia
),
totais_mensais as (
  select
    lv.contrato_id,
    lv.competencia,
    lv.competencia_data,
    sum(lv.valor)::numeric(14, 2) as valor_mensal,
    case
      when count(distinct lv.dia_vencimento) = 1 then min(lv.dia_vencimento)
      else null
    end as dia_vencimento
  from lancamentos_validos lv
  group by lv.contrato_id, lv.competencia, lv.competencia_data
),
recorrencia as (
  select
    tm.contrato_id,
    count(*) as total_competencias,
    count(*) filter (
      where tm.competencia_data between j.competencia_referencia - interval '3 months' and j.competencia_referencia
    ) as competencias_recentes,
    max(tm.competencia_data) as ultima_competencia,
    j.competencia_referencia,
    bool_or(tm.competencia_data = j.competencia_referencia) as tem_competencia_referencia
  from totais_mensais tm
  cross join janela j
  group by tm.contrato_id, j.competencia_referencia
),
valores_recentes as (
  select
    tm.contrato_id,
    tm.valor_mensal,
    count(*) as repeticoes,
    sum(count(*)) over (partition by tm.contrato_id) as total_observado,
    max(tm.competencia_data) as ultima_competencia_valor
  from totais_mensais tm
  join janela j on true
  where tm.competencia_data between j.competencia_referencia - interval '3 months' and j.competencia_referencia
  group by tm.contrato_id, tm.valor_mensal
),
valor_confiavel as (
  select distinct on (vr.contrato_id)
    vr.contrato_id,
    vr.valor_mensal
  from valores_recentes vr
  join recorrencia r on r.contrato_id = vr.contrato_id
  join totais_mensais referencia
    on referencia.contrato_id = vr.contrato_id
   and referencia.competencia_data = r.competencia_referencia
   and referencia.valor_mensal = vr.valor_mensal
  where vr.repeticoes >= 2
    and vr.repeticoes::numeric / nullif(vr.total_observado, 0) >= 0.75
  order by vr.contrato_id, vr.repeticoes desc, vr.ultima_competencia_valor desc
),
dias_recentes as (
  select
    tm.contrato_id,
    tm.dia_vencimento,
    count(*) as repeticoes,
    sum(count(*)) over (partition by tm.contrato_id) as total_observado,
    max(tm.competencia_data) as ultima_competencia_dia
  from totais_mensais tm
  join janela j on true
  where tm.competencia_data between j.competencia_referencia - interval '3 months' and j.competencia_referencia
    and tm.dia_vencimento is not null
  group by tm.contrato_id, tm.dia_vencimento
),
dia_confiavel as (
  select distinct on (dr.contrato_id)
    dr.contrato_id,
    dr.dia_vencimento
  from dias_recentes dr
  join recorrencia r on r.contrato_id = dr.contrato_id
  join totais_mensais referencia
    on referencia.contrato_id = dr.contrato_id
   and referencia.competencia_data = r.competencia_referencia
   and referencia.dia_vencimento = dr.dia_vencimento
  where dr.repeticoes >= 2
    and dr.repeticoes::numeric / nullif(dr.total_observado, 0) >= 0.75
  order by dr.contrato_id, dr.repeticoes desc, dr.ultima_competencia_dia desc
),
filial_confiavel as (
  select distinct on (lv.contrato_id)
    lv.contrato_id,
    lv.filial_id
  from lancamentos_validos lv
  join janela j on true
  where lv.filial_id is not null
    and lv.competencia_data between j.competencia_referencia - interval '3 months' and j.competencia_referencia
  group by lv.contrato_id, lv.filial_id
  order by lv.contrato_id, count(*) desc, max(lv.competencia_data) desc, lv.filial_id
),
contratos_confiaveis as (
  select
    cm.id,
    vc.valor_mensal,
    dc.dia_vencimento,
    fc.filial_id
  from public.contratos_mensais cm
  join recorrencia r on r.contrato_id = cm.id
  left join valor_confiavel vc on vc.contrato_id = cm.id
  left join dia_confiavel dc on dc.contrato_id = cm.id
  left join filial_confiavel fc on fc.contrato_id = cm.id
  where coalesce(cm.tipo_contrato, 'Recorrente') = 'Recorrente'
    and cm.status <> 'Cancelado'
    and (cm.data_fim is null or cm.data_fim >= r.competencia_referencia)
    and r.total_competencias >= 3
    and r.competencias_recentes >= 2
    and r.tem_competencia_referencia
)
update public.contratos_mensais cm
set
  status = 'Ativo',
  valor_base_previsto = coalesce(cc.valor_mensal, cm.valor_base_previsto),
  dia_vencimento = coalesce(cc.dia_vencimento, cm.dia_vencimento),
  filial_id = coalesce(cc.filial_id, cm.filial_id),
  updated_at = now()
from contratos_confiaveis cc
where cm.id = cc.id
  and (
    cm.status <> 'Ativo'
    or (cc.valor_mensal is not null and cm.valor_base_previsto is distinct from cc.valor_mensal)
    or (cc.dia_vencimento is not null and cm.dia_vencimento is distinct from cc.dia_vencimento)
    or (cc.filial_id is not null and cm.filial_id is distinct from cc.filial_id)
  );
