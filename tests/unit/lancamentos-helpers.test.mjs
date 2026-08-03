import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  limparNumero,
  limparTexto,
  normalizarCampoLancamento,
  normalizarData,
  normalizarNumeroNota,
} from '../../src/backend/api/lancamentos/helpers.js';

describe('helpers de lancamentos', () => {
  it('normaliza numero de nota fiscal para 9 digitos', () => {
    assert.deepEqual(normalizarNumeroNota('018'), { value: '000000018', error: null });
    assert.deepEqual(normalizarNumeroNota('123456789'), { value: '123456789', error: null });
  });

  it('bloqueia numero de nota com mais de 9 digitos', () => {
    const result = normalizarNumeroNota('1234567890');

    assert.equal(result.value, null);
    assert.match(result.error, /9 digitos/);
  });

  it('aceita valores monetarios com virgula, ponto decimal e separador de milhar', () => {
    assert.equal(limparNumero('1566,93'), 1566.93);
    assert.equal(limparNumero('1.566,93'), 1566.93);
    assert.equal(limparNumero('1566.93'), 1566.93);
    assert.equal(limparNumero('R$ 1.566,93'), 1566.93);
  });

  it('retorna null para textos vazios ou valores numericos invalidos', () => {
    assert.equal(limparTexto('  '), null);
    assert.equal(limparTexto('null'), null);
    assert.equal(limparNumero('abc'), null);
  });

  it('normaliza datas ISO e datas brasileiras', () => {
    assert.equal(normalizarData('2026-07-20T03:00:00.000Z'), '2026-07-20');
    assert.equal(normalizarData('20/07/2026'), '2026-07-20');
    assert.equal(normalizarData('20-07-2026'), '20-07-2026');
    assert.equal(normalizarData('20/07/26'), null);
  });
});

describe('edicao inline de lancamentos', () => {
  it('normaliza campo numero_nota para o PATCH inline', () => {
    assert.deepEqual(normalizarCampoLancamento('numero_nota', '18'), {
      field: 'numero_nota',
      value: '000000018',
    });
  });

  it('normaliza campo valor_boleto para o PATCH inline', () => {
    assert.deepEqual(normalizarCampoLancamento('valor_boleto', '1.566,93'), {
      field: 'valor_boleto',
      value: 1566.93,
    });
  });

  it('normaliza campo boleto_grupo para texto limpo', () => {
    assert.deepEqual(normalizarCampoLancamento('boleto_grupo', '  ALGAR-2026-07-01  '), {
      field: 'boleto_grupo',
      value: 'ALGAR-2026-07-01',
    });
  });

  it('recusa campos fora da lista segura de edicao inline', () => {
    const result = normalizarCampoLancamento('fornecedor_id', 99);

    assert.equal(result.value, undefined);
    assert.match(result.error, /Campo nao permitido/);
  });
});
