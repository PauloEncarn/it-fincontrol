import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// PUT: Atualizar um lançamento
export async function PUT(request, context) {
  try {
    const { id } = context.params;
    const body = await request.json();

    // Tratamento de campos: se data_envio vier vazia, vira NULL
    const payload = {
        ...body,
        data_envio: body.data_envio === '' ? null : body.data_envio,
    };

    // Remove campos que não devem ser atualizados (como objetos aninhados de leitura)
    delete payload.fornecedor;
    delete payload.filial;
    delete payload.id; // Não atualizamos o ID

    const { error } = await supabase
      .from('lancamentos')
      .update(payload)
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Excluir um lançamento
export async function DELETE(request, context) {
  try {
    const { id } = context.params;

    const { error } = await supabase
      .from('lancamentos')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}