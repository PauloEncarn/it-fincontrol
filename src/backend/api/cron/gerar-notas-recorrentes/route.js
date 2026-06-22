import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { competenciaAtualSaoPaulo, gerarNotasPendentes, todayInSaoPaulo } from '@/backend/api/contratos/geracao-recorrente';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const dynamic = 'force-dynamic';

function authorized(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;

  const auth = request.headers.get('authorization') || '';
  const urlSecret = new URL(request.url).searchParams.get('secret');

  return auth === `Bearer ${secret}` || urlSecret === secret;
}

export async function GET(request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'NÃ£o autorizado.' }, { status: 401 });
  }

  let resumo;
  try {
    resumo = await gerarNotasPendentes(supabase, {
      competencia: competenciaAtualSaoPaulo(),
      janelaDias: 20,
      aplicarJanela: true,
      hoje: todayInSaoPaulo(),
      origem: 'job',
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(resumo, {
    status: resumo.erros.length ? 207 : 200,
    headers: { 'Cache-Control': 'no-store' },
  });
}
