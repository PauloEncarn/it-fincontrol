import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// --- PUT: ATUALIZAR ---
export async function PUT(request, { params }) {
  try {
    const { id } = params; 
    const body = await request.json();

    // 👇 REMOVE ID DO CORPO (Segurança)
    const { id: idCorpo, created_at, responsavel, ...dados } = body;

    const payload = {
      ...dados,
      filial_id: body.filial_id ? parseInt(body.filial_id) : null,
      fornecedor_id: body.fornecedor_id ? parseInt(body.fornecedor_id) : null,
      valor: body.valor ? parseFloat(body.valor) : 0,
      data_vencimento: body.data_vencimento || null,
    };

    const { data, error } = await supabase
      .from('solicitacoes_compra')
      .update(payload)
      .eq('id', id)
      .select();

    if (error) throw error;
    return NextResponse.json(data[0]);
  } catch (error) {
    console.error("Erro no PUT:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
// --- DELETE: EXCLUIR ---
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    const { error } = await supabase
      .from('solicitacoes_compra')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ message: "Excluído com sucesso" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}