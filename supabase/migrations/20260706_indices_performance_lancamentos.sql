create index if not exists idx_lancamentos_data_vencimento
  on public.lancamentos (data_vencimento);

create index if not exists idx_lancamentos_filial
  on public.lancamentos (filial_id);

create index if not exists idx_lancamentos_fornecedor
  on public.lancamentos (fornecedor_id);

create index if not exists idx_lancamentos_status_pagamento
  on public.lancamentos (status_pagamento);

create index if not exists idx_lancamentos_contrato
  on public.lancamentos (contrato_id)
  where contrato_id is not null;

create index if not exists idx_lancamentos_vencimento_filial
  on public.lancamentos (data_vencimento, filial_id);
