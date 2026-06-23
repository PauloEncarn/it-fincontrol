-- Limpa observacoes tecnicas criadas anteriormente pela geracao recorrente.
-- As novas notas geradas por contrato passam a nascer sem observacao; a rastreabilidade fica na timeline.

update public.lancamentos
set observacao = null
where contrato_id is not null
  and observacao is not null
  and (
    observacao ilike '%Contrato interno ID%'
    or observacao ilike '%Gerado automaticamente por contrato recorrente%'
  );
