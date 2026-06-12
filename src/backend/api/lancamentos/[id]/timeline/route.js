import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request, context) {
  try {
    const params = await context.params;
    const id = params.id;

    if (!id || id === 'undefined') {
      return NextResponse.json({ error: 'ID invalido.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('lancamento_eventos')
      .select('*')
      .eq('lancamento_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('[lancamentos/timeline] Erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

