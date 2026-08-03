import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { calcularBoletoResumoPorGrupo } from '../../src/backend/api/dados-agrupados/helpers.js';

describe('helpers de dados agrupados', () => {
  it('marca boleto compartilhado como OK quando a soma das notas bate com o boleto', () => {
    const resumo = calcularBoletoResumoPorGrupo([
      { id: 1, numero_nota: '000000001', valor: 60, boleto_grupo: 'ALGAR-07', valor_boleto: 100 },
      { id: 2, numero_nota: '000000002', valor: 40, boleto_grupo: 'ALGAR-07', valor_boleto: null },
    ]);

    assert.equal(resumo['ALGAR-07'].soma_notas, 100);
    assert.equal(resumo['ALGAR-07'].valor_boleto, 100);
    assert.equal(resumo['ALGAR-07'].diferenca, 0);
    assert.equal(resumo['ALGAR-07'].ok, true);
    assert.equal(resumo['ALGAR-07'].notas.length, 2);
  });

  it('marca divergencia quando a soma das notas nao bate com o valor do boleto', () => {
    const resumo = calcularBoletoResumoPorGrupo([
      { id: 1, numero_nota: '000000001', valor: 60, boleto_grupo: 'ALGAR-07', valor_boleto: 110 },
      { id: 2, numero_nota: '000000002', valor: 40, boleto_grupo: 'ALGAR-07', valor_boleto: null },
    ]);

    assert.equal(resumo['ALGAR-07'].soma_notas, 100);
    assert.equal(resumo['ALGAR-07'].valor_boleto, 110);
    assert.equal(resumo['ALGAR-07'].diferenca, -10);
    assert.equal(resumo['ALGAR-07'].ok, false);
  });

  it('mantem status indefinido quando o grupo nao tem valor de boleto informado', () => {
    const resumo = calcularBoletoResumoPorGrupo([
      { id: 1, numero_nota: '000000001', valor: 60, boleto_grupo: 'ALGAR-07', valor_boleto: null },
      { id: 2, numero_nota: '000000002', valor: 40, boleto_grupo: 'ALGAR-07', valor_boleto: null },
    ]);

    assert.equal(resumo['ALGAR-07'].soma_notas, 100);
    assert.equal(resumo['ALGAR-07'].valor_boleto, null);
    assert.equal(resumo['ALGAR-07'].diferenca, null);
    assert.equal(resumo['ALGAR-07'].ok, null);
  });
});
