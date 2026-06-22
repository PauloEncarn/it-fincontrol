import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getActorFromRequest } from '@/backend/utils/audit';
import { competenciaAtualSaoPaulo, gerarNotasPendentes } from '@/backend/api/contratos/geracao-recorrente';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const ator = await getActorFromRequest(request);
    const body = await request.json().catch(() => ({}));
    const competencia = body.competencia || competenciaAtualSaoPaulo();

    const resumo = await gerarNotasPendentes(supabase, {
      competencia,
      aplicarJanela: false,
      ator,
      origem: 'manual_lote',
    });

    return NextResponse.json(resumo, {
      status: resumo.erros.length ? 207 : 200,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
