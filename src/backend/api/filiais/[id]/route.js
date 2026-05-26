import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function PUT(request, context) {
  try {
    const params = await context.params;
    const id = params.id;
    
    const body = await request.json();
    const { error } = await supabase.from('filiais').update(body).eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    const params = await context.params;
    const id = params.id;

    const { error } = await supabase.from('filiais').delete().eq('id', id);

    if (error) {
       // Tratamento de erro se a filial tiver notas
      if (error.code === '23503') {
        return NextResponse.json(
          { error: 'Não é possível excluir: Esta filial possui lançamentos vinculados.' }, 
          { status: 400 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}