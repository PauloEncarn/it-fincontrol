-- Popula dia_vencimento em contratos_mensais a partir de padroes recorrentes
-- observados no historico de faturas. Usa apenas padroes com pelo menos 75%
-- de confianca e 2+ repeticoes para evitar contratos com vencimento variavel.

with vencimentos (nome_empresa, contrato_usado, dia_vencimento, repeticoes, total_observado) as (
  values
    ('ALGAR TELECOM', '201178', 20, 24, 24),
    ('ALGAR TELECOM', '201179', 20, 12, 12),
    ('ALGAR TELECOM', '201326', 20, 12, 12),
    ('ALGAR TELECOM', '201432', 20, 11, 11),
    ('ALGAR TELECOM', '201583', 20, 4, 4),
    ('ALGAR TELECOM', '201597', 20, 4, 4),
    ('ALGAR TELECOM', '300081', 20, 11, 11),
    ('CLARO / EMBRATEL', '201129', 25, 12, 12),
    ('CLARO / EMBRATEL', '201459', 15, 11, 11),
    ('CONTROLLER', '201126', 25, 12, 12),
    ('DIRECTCALL', '201127', 14, 17, 17),
    ('DOWNUP', '201131', 5, 23, 23),
    ('DSX IT SOLUTIONS', '201625', 15, 3, 3),
    ('DW SERVICES', '201176', 22, 12, 12),
    ('DW SERVICES', '201181', 22, 12, 12),
    ('DW SERVICES', '201438', 22, 11, 11),
    ('DW SERVICES', '201596', 22, 4, 4),
    ('DW SERVICES', '201601', 22, 4, 4),
    ('DW SERVICES', '300076', 22, 11, 11),
    ('G7 TECNOLOGIA', '201177', 14, 12, 12),
    ('ITS TELECOMUNICACOES', '201130', 5, 17, 17),
    ('IZATECH', '201128', 15, 11, 11),
    ('LG INFORMATICA', '201156', 18, 21, 22),
    ('LOCAWEB', '201184', 10, 19, 19),
    ('MERCANET', '1000007', 22, 11, 12),
    ('NEOGRID', '201233', 19, 6, 7),
    ('ONLINE NORTE', '201125', 17, 12, 12),
    ('ONNET TELECOMUNICACOES', '201466', 15, 3, 3),
    ('PCM SOLUCOES', '201590', 22, 8, 8),
    ('SCANSOURCE', '201175', 15, 11, 11),
    ('TD SYNNEX', '1000008', 10, 3, 3),
    ('TD SYNNEX', '201271', 16, 12, 12),
    ('TIM', '201092', 20, 12, 12),
    ('TOTVS', '1000037', 24, 12, 12),
    ('VIVO / TELEFONICA', '1000021', 17, 11, 12),
    ('VIVO / TELEFONICA', '201182', 3, 104, 104),
    ('VIVO / TELEFONICA', '201236', 25, 36, 36),
    ('WBRNET INTERNET', '201574', 15, 5, 5)
)
update public.contratos_mensais cm
set dia_vencimento = v.dia_vencimento
from vencimentos v
join public.fornecedores f
  on f.nome_empresa = v.nome_empresa
where cm.fornecedor_id = f.id
  and cm.contrato_usado = v.contrato_usado
  and (cm.dia_vencimento is null or cm.dia_vencimento = 1);
