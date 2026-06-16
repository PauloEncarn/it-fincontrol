export const numberOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

export const textOrNull = (value) => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text || null;
};

export const listValues = (value) => {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (value === null || value === undefined) return [];
  return String(value).split(/[;|\n]/).map((item) => item.trim()).filter(Boolean);
};

export const payloadFromBody = (body) => ({
  fornecedor_id: numberOrNull(body.fornecedor_id),
  filial_id: numberOrNull(body.filial_id),
  tipo_contrato: textOrNull(body.tipo_contrato) || 'Recorrente',
  cnpj_usado: textOrNull(body.cnpj_usado),
  contrato_usado: textOrNull(body.contrato_usado),
  nome_contrato: textOrNull(body.nome_contrato),
  subcontrato_nome: textOrNull(body.subcontrato_nome),
  produto_protheus: textOrNull(body.produto_protheus),
  centro_custo_usado: textOrNull(body.centro_custo_usado),
  descricao_servico: textOrNull(body.descricao_servico),
  servico_protheus: textOrNull(body.servico_protheus),
  detalhe: textOrNull(body.detalhe),
  fluxo_lancamento: textOrNull(body.fluxo_lancamento) || 'manual',
  email_destino: textOrNull(body.email_destino),
  responsavel_interno: textOrNull(body.responsavel_interno),
  regra_lancamento: textOrNull(body.regra_lancamento),
  valor_base_previsto: numberOrNull(body.valor_base_previsto) || 0,
  dia_vencimento: numberOrNull(body.dia_vencimento) || 1,
  tolerancia_percentual: numberOrNull(body.tolerancia_percentual) ?? 5,
  status: textOrNull(body.status) || 'Ativo',
  data_inicio: textOrNull(body.data_inicio),
  data_fim: textOrNull(body.data_fim),
  observacao: textOrNull(body.observacao),
  updated_at: new Date().toISOString(),
});

export async function validateFornecedorLists(supabase, payload) {
  if (!payload.fornecedor_id) return 'Fornecedor é obrigatório.';
  if (!['Recorrente', 'Avulso'].includes(payload.tipo_contrato)) return 'Tipo de contrato inválido.';

  const { data: fornecedor, error } = await supabase
    .from('fornecedores')
    .select('id, lista_cnpjs, lista_contratos, lista_centro_custos')
    .eq('id', payload.fornecedor_id)
    .single();

  if (error) return error.message;
  if (!fornecedor) return 'Fornecedor não encontrado.';

  const cnpjs = listValues(fornecedor.lista_cnpjs);
  if (cnpjs.length && !payload.cnpj_usado) {
    return 'Selecione um CNPJ cadastrado no fornecedor.';
  }

  const checks = [
    ['CNPJ', payload.cnpj_usado, cnpjs],
    ['Contrato', payload.contrato_usado, listValues(fornecedor.lista_contratos)],
    ['Centro de custo', payload.centro_custo_usado, listValues(fornecedor.lista_centro_custos)],
  ];

  for (const [label, selected, allowed] of checks) {
    if (!allowed.length || !selected) continue;
    if (!allowed.includes(selected)) {
      return `${label} precisa estar cadastrado na lista do fornecedor.`;
    }
  }

  return null;
}
