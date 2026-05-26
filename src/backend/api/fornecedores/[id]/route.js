import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function PUT(request, context) {
  try {
    // Correção para Next.js recente: await params
    const params = await context.params; 
    const id = params.id;
    
    const body = await request.json();
    const { error } = await supabase.from('fornecedores').update(body).eq('id', id);

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

    const { error } = await supabase.from('fornecedores').delete().eq('id', id);

    if (error) {
      // Código 23503 é violação de Foreign Key (tem notas vinculadas)
      if (error.code === '23503') {
        return NextResponse.json(
          { error: 'Não é possível excluir: Este fornecedor possui lançamentos vinculados.' }, 
          { status: 400 } // Retorna 400 (Bad Request) em vez de 500
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro Delete Fornecedor:", error);
    return NextResponse.json({ error: error.message || 'Erro ao excluir' }, { status: 500 });
  }
}