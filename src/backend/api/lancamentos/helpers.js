export const limparTexto = (valor) => {
  if (valor === null || valor === undefined) return null;
  const stringVal = String(valor).trim();
  if (stringVal === '' || stringVal === 'undefined' || stringVal === 'null') return null;
  return stringVal;
};

export const limparNumero = (valor) => {
  if (valor === null || valor === undefined) return null;
  const stringVal = String(valor).trim();
  if (stringVal === '' || stringVal === 'undefined' || stringVal === 'null' || stringVal === 'NaN') return null;

  const cleaned = stringVal.replace(/[^\d,.-]/g, '');
  if (!cleaned) return null;

  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');
  let normalized = cleaned;

  if (hasComma && hasDot) {
    const decimalSeparator = cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.') ? ',' : '.';
    const thousandSeparator = decimalSeparator === ',' ? '.' : ',';
    normalized = cleaned
      .replace(new RegExp(`\\${thousandSeparator}`, 'g'), '')
      .replace(decimalSeparator, '.');
  } else if (hasComma) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (hasDot) {
    const parts = cleaned.split('.');
    normalized = parts.length > 2 ? cleaned.replace(/\./g, '') : cleaned;
  }

  const numero = Number(normalized);
  return Number.isNaN(numero) ? null : numero;
};

export const normalizarNumeroNota = (valor) => {
  const texto = limparTexto(valor);
  if (!texto) return { value: null, error: null };

  const digits = texto.replace(/\D/g, '');
  if (!digits) return { value: null, error: null };
  if (digits.length > 9) {
    return { value: null, error: 'Numero da nota fiscal deve ter no maximo 9 digitos.' };
  }

  return { value: digits.padStart(9, '0'), error: null };
};

export const normalizarData = (valor) => {
  const texto = limparTexto(valor);
  if (!texto) return null;

  const isoDate = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDate) return `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`;

  const brDate = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brDate) return `${brDate[3]}-${brDate[2]}-${brDate[1]}`;

  return texto.includes('/') ? null : texto;
};

const FIELD_NORMALIZERS = {
  numero_nota: (value) => {
    const numeroNota = normalizarNumeroNota(value);
    if (numeroNota.error) return { error: numeroNota.error };
    return { value: numeroNota.value };
  },
  valor: (value) => ({ value: limparNumero(value) || 0 }),
  valor_previsto: (value) => ({ value: limparNumero(value) }),
  valor_boleto: (value) => ({ value: limparNumero(value) }),
  data_vencimento: (value) => ({ value: normalizarData(value) }),
  data_envio: (value) => ({ value: normalizarData(value) }),
  cnpj_usado: (value) => ({ value: limparTexto(value) }),
  contrato_usado: (value) => ({ value: limparTexto(value) }),
  centro_custo_usado: (value) => ({ value: limparTexto(value) }),
  descricao_servico: (value) => ({ value: limparTexto(value) }),
  servico_protheus: (value) => ({ value: limparTexto(value) }),
  numero_medicao: (value) => ({ value: limparTexto(value) }),
  numero_pedido: (value) => ({ value: limparTexto(value) }),
  solicitacao_fluig: (value) => ({ value: limparTexto(value) }),
  observacao: (value) => ({ value: limparTexto(value) }),
  arquivo_nota: (value) => ({ value: limparTexto(value) }),
  arquivo_boleto: (value) => ({ value: limparTexto(value) }),
  boleto_grupo: (value) => ({ value: limparTexto(value) }),
  observacao_boleto: (value) => ({ value: limparTexto(value) }),
};

export const CAMPOS_EDICAO_INLINE = Object.keys(FIELD_NORMALIZERS);

export const normalizarCampoLancamento = (field, value) => {
  const campo = limparTexto(field);
  if (!campo || !FIELD_NORMALIZERS[campo]) {
    return { error: 'Campo nao permitido para edicao rapida.' };
  }

  return { field: campo, ...FIELD_NORMALIZERS[campo](value) };
};
