import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { diffLancamentoFields, getActorFromRequest, registrarEventoLancamento } from '@/backend/utils/audit';
import { normalizarCampoLancamento } from '../../helpers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function PATCH(request, context) {
  try {
    const ator = await getActorFromRequest(request);
    const params = await context.params;
    const id = params.id;

    if (!id || id === 'undefined') {
      return NextResponse.json({ error: 'ID invalido.' }, { status: 400 });
    }

    const body = await request.json();
    const normalized = normalizarCampoLancamento(body.field, body.value);
    if (normalized.error) {
      return NextResponse.json({ error: normalized.error }, { status: 400 });
    }
    const field = normalized.field;

    const { data: notaAntes, error: erroBusca } = await supabase
      .from('lancamentos')
      .select('*')
      .eq('id', id)
      .single();

    if (erroBusca) throw erroBusca;

    if (body.expected_updated_at && notaAntes.updated_at && String(body.expected_updated_at) !== String(notaAntes.updated_at)) {
      return NextResponse.json({
        error: 'Esta nota foi alterada por outro usuario. Recarregue antes de salvar.',
        code: 'STALE_LANCAMENTO',
        current: notaAntes,
      }, { status: 409 });
    }

    const payload = { [field]: normalized.value, updated_at: new Date().toISOString() };

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
