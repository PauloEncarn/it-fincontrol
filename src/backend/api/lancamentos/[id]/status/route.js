import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ETAPAS_VALIDAS = ['pendente', 'em_andamento', 'em_analise', 'contingencia', 'concluida'];

const limparTexto = (value) => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text || null;
};

export async function PATCH(request, context) {
  try {
    const params = await context.params;
    const id = params.id;
    const body = await request.json();

    let novoStatus = body.status_pagamento || body.status;
    if (novoStatus === true) novoStatus = 'Pago';
    if (novoStatus === false) novoStatus = 'Pendente';

    const novaEtapa = limparTexto(body.etapa);
    const payload = {};

    if (novoStatus !== undefined && novoStatus !== null && String(novoStatus).trim()) {
      payload.status_pagamento = String(novoStatus).trim();
    }

    if (novaEtapa) {
      if (!ETAPAS_VALIDAS.includes(novaEtapa)) {
        return NextResponse.json({ error: 'Etapa inválida.' }, { status: 400 });
      }

      payload.etapa = novaEtapa;
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: 'Informe status ou etapa.' }, { status: 400 });
    }

    const { error } = await supabase
      .from('lancamentos')
      .update(payload)
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[lancamentos/status] Erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
