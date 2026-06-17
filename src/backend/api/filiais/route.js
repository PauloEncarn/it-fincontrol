import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const normalizeCodigoFilial = (codigo) => {
  const digits = String(codigo || '').replace(/\D/g, '');
  return digits ? digits.padStart(6, '0') : '';
};

export async function GET() {
  const { data, error } = await supabase
    .from('filiais')
    .select('*')
    .order('nome_fantasia', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request) {
  const data = await request.json();
  const payload = { ...data, codigo: normalizeCodigoFilial(data.codigo) };
  const { error } = await supabase.from('filiais').insert([payload]);
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function PUT(request) { // Caso precise editar
    const data = await request.json();
    const { id, ...updateData } = data;
    if ('codigo' in updateData) updateData.codigo = normalizeCodigoFilial(updateData.codigo);
    const { error } = await supabase.from('filiais').update(updateData).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
