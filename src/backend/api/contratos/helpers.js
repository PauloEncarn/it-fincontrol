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

const normalizeKeyPart = (value) => String(value ?? '').trim().toLowerCase();

const sameContratoIdentity = (a, b) => (
  normalizeKeyPart(a.filial_id) === normalizeKeyPart(b.filial_id) &&
  normalizeKeyPart(a.descricao_servico) === normalizeKeyPart(b.descricao_servico) &&
  normalizeKeyPart(a.produto_protheus) === normalizeKeyPart(b.produto_protheus) &&
  normalizeKeyPart(a.centro_custo_usado) === normalizeKeyPart(b.centro_custo_usado) &&
  normalizeKeyPart(a.subcontrato_nome) === normalizeKeyPart(b.subcontrato_nome)
);

const normalizeMoneyText = (value) => {
  const text = String(value ?? '').trim();
  if (!text) return '';

  const cleaned = text.replace(/[^\d,.-]/g, '');
  if (!cleaned) return '';

  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');
  let normalized = cleaned;

  if (hasComma && hasDot) {
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    const decimalSeparator = lastComma > lastDot ? ',' : '.';
    const thousandSeparator = decimalSeparator === ',' ? '.' : ',';
    normalized = cleaned
      .replace(new RegExp(`\\${thousandSeparator}`, 'g'), '')
      .replace(decimalSeparator, '.');
  } else if (hasComma) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (hasDot) {
    const parts = cleaned.split('.');
    const decimalPart = parts[parts.length - 1];
    normalized = decimalPart.length <= 2
      ? cleaned.replace(/,/g, '')
      : cleaned.replace(/\./g, '');
  }

  const number = Number(normalized);
  if (Number.isNaN(number)) return text;
  return String(Math.round(number * 100));
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

export async function validateFornecedorLists(supabase, payload, existingContrato = null) {
  if (!payload.fornecedor_id) return 'Fornecedor é obrigatório.';
  if (!['Recorrente', 'Avulso'].includes(payload.tipo_contrato)) return 'Tipo de contrato inválido.';

  const { data: fornecedor, error } = await supabase
    .from('fornecedores')
    .select('id, lista_cnpjs, lista_contratos, lista_centro_custos, lista_servicos, lista_produtos_protheus, lista_valores')
    .eq('id', payload.fornecedor_id)
    .single();

  if (error) return error.message;
  if (!fornecedor) return 'Fornecedor não encontrado.';

  const cnpjs = listValues(fornecedor.lista_cnpjs);
  if (cnpjs.length && !payload.cnpj_usado) {
    return 'Selecione um CNPJ cadastrado no fornecedor.';
  }

  const withExisting = (field, values, normalize = (item) => item) => {
    const currentValue = existingContrato?.[field];
    if (currentValue === null || currentValue === undefined || currentValue === '') return values;

    const normalizedCurrent = normalize(String(currentValue).trim());
    return values.includes(normalizedCurrent) ? values : [...values, normalizedCurrent];
  };

  const checks = [
    ['CNPJ', payload.cnpj_usado, withExisting('cnpj_usado', cnpjs)],
    ['Contrato', payload.contrato_usado, withExisting('contrato_usado', listValues(fornecedor.lista_contratos))],
    ['Centro de custo', payload.centro_custo_usado, withExisting('centro_custo_usado', listValues(fornecedor.lista_centro_custos))],
    ['Serviço', payload.descricao_servico, withExisting('descricao_servico', listValues(fornecedor.lista_servicos))],
    ['Produto Protheus', payload.produto_protheus, withExisting('produto_protheus', listValues(fornecedor.lista_produtos_protheus))],
    ['Valor previsto', payload.valor_base_previsto ? normalizeMoneyText(payload.valor_base_previsto) : '', withExisting('valor_base_previsto', listValues(fornecedor.lista_valores).map(normalizeMoneyText), normalizeMoneyText)],
  ];

  for (const [label, selected, allowed] of checks) {
    if (!allowed.length || !selected) continue;
    if (!allowed.includes(selected)) {
      return `${label} precisa estar cadastrado na lista do fornecedor.`;
    }
  }

  return null;
}

export async function validateContratoUnico(supabase, payload, currentId = null) {
  if (!payload.fornecedor_id || !payload.contrato_usado) return null;

  let query = supabase
    .from('contratos_mensais')
    .select('id, filial_id, contrato_usado, subcontrato_nome, descricao_servico, produto_protheus, centro_custo_usado')
    .eq('fornecedor_id', payload.fornecedor_id)
    .eq('contrato_usado', payload.contrato_usado);

  if (currentId) query = query.neq('id', currentId);

  const { data, error } = await query;
  if (error) return error.message;

  const duplicado = (data || []).find((contrato) => sameContratoIdentity(contrato, payload));
  if (!duplicado) return null;

  return 'Ja existe um contrato cadastrado para este fornecedor com o mesmo numero, filial, servico, produto, centro de custo e item.';
}
