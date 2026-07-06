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
