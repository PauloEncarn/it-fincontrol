alter table public.lancamentos
  add column if not exists etapa text not null default 'pendente';

update public.lancamentos
set etapa = case
  when lower(coalesce(status_pagamento, '')) like '%em andamento%' then 'em_andamento'
  when lower(coalesce(status_pagamento, '')) like '%aprovação%' then 'em_analise'
  when lower(coalesce(status_pagamento, '')) like '%aprovacao%' then 'em_analise'
  when lower(coalesce(status_pagamento, '')) like '%confirmação%' then 'em_analise'
  when lower(coalesce(status_pagamento, '')) like '%confirmacao%' then 'em_analise'
  when lower(coalesce(status_pagamento, '')) like '%análise%' then 'em_analise'
  when lower(coalesce(status_pagamento, '')) like '%analise%' then 'em_analise'
  when lower(coalesce(status_pagamento, '')) like '%nota recebida%' then 'em_analise'
  when lower(coalesce(status_pagamento, '')) like '%conting%' then 'contingencia'
  when lower(coalesce(status_pagamento, '')) like '%diverg%' then 'contingencia'
  when lower(coalesce(status_pagamento, '')) like '%cancel%' then 'contingencia'
  when lower(coalesce(status_pagamento, '')) like '%rejeit%' then 'contingencia'
  when lower(coalesce(status_pagamento, '')) like '%conclu%' then 'concluida'
  when lower(coalesce(status_pagamento, '')) like '%pago%' then 'concluida'
  else 'pendente'
end
where etapa = 'pendente';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'lancamentos_etapa_check'
  ) then
    alter table public.lancamentos
      add constraint lancamentos_etapa_check
      check (etapa in ('pendente', 'em_andamento', 'em_analise', 'contingencia', 'concluida'));
  end if;
end $$;

create index if not exists idx_lancamentos_etapa on public.lancamentos(etapa);
