import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { diffLancamentoFields, getActorFromRequest, registrarEventoLancamento } from '@/backend/utils/audit';
import { limparNumero, limparTexto, normalizarData, normalizarNumeroNota } from '../../helpers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

export async function PATCH(request, context) {
  try {
    const ator = await getActorFromRequest(request);
    const params = await context.params;
    const id = params.id;

    if (!id || id === 'undefined') {
      return NextResponse.json({ error: 'ID invalido.' }, { status: 400 });
    }

    const body = await request.json();
    const field = limparTexto(body.field);

    if (!field || !FIELD_NORMALIZERS[field]) {
      return NextResponse.json({ error: 'Campo nao permitido para edicao rapida.' }, { status: 400 });
    }

    const normalized = FIELD_NORMALIZERS[field](body.value);
    if (normalized.error) {
      return NextResponse.json({ error: normalized.error }, { status: 400 });
    }

    const { data: notaAntes, error: erroBusca } = await supabase
      .from('lancamentos')
      .select('*')
      .eq('id', id)
      .single();

    if (erroBusca) throw erroBusca;

    const payload = { [field]: normalized.value };

    const { data, error } = await supabase
      .from('lancamentos')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const camposAlterados = diffLancamentoFields(notaAntes, data, [field]);
    await registrarEventoLancamento(supabase, {
      lancamentoId: id,
      tipo: 'edicao_inline',
      titulo: 'Campo atualizado',
      descricao: camposAlterados.length
        ? `${field}: ${String(camposAlterados[0].antes ?? '-')} -> ${String(camposAlterados[0].depois ?? '-')}`
        : 'Campo salvo sem mudanca relevante.',
      ator,
      antes: notaAntes,
      depois: data,
      metadata: { campo: field, campos_alterados: camposAlterados },
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('[lancamentos/campo] Erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
