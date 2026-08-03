export const calcularBoletoResumoPorGrupo = (notas = []) => {
  const resumoPorGrupo = (notas || []).reduce((grupos, nota) => {
    const grupo = String(nota.boleto_grupo || '').trim();
    if (!grupo) return grupos;

    if (!grupos[grupo]) {
      grupos[grupo] = {
        grupo,
        notas: [],
        soma_notas: 0,
        valor_boleto: null,
        diferenca: null,
        ok: null,
      };
    }

    grupos[grupo].notas.push({
      id: nota.id,
      numero_nota: nota.numero_nota,
      valor: Number(nota.valor || 0),
    });
    grupos[grupo].soma_notas += Number(nota.valor || 0);

    if (grupos[grupo].valor_boleto === null && nota.valor_boleto !== null && nota.valor_boleto !== undefined) {
      grupos[grupo].valor_boleto = Number(nota.valor_boleto || 0);
    }

    return grupos;
  }, {});

  return Object.fromEntries(Object.entries(resumoPorGrupo).map(([grupo, resumo]) => {
    const diferenca = resumo.valor_boleto === null ? null : resumo.soma_notas - resumo.valor_boleto;

    return [grupo, {
      ...resumo,
      diferenca,
      ok: diferenca === null ? null : Math.abs(diferenca) < 0.01,
    }];
  }));
};
