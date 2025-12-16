import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// PUT: Atualizar fornecedor
export async function PUT(request, context) {
  try {
    const { id } = context.params;
    const body = await request.json();

    const { error } = await supabase
      .from('fornecedores')
      .update(body)
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Excluir fornecedor
export async function DELETE(request, context) {
  try {
    const { id } = context.params;

    // Opcional: Verificar se existem lançamentos vinculados antes de excluir
    // Mas para simplificar agora, vamos tentar excluir direto. 
    // Se tiver Foreign Key, o Supabase vai dar erro avisando (o que é bom).
    const { error } = await supabase
      .from('fornecedores')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}