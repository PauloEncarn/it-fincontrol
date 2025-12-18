import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// --- PUT: ATUALIZAR UMA SOLICITAÇÃO EXISTENTE ---
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();

    // Tratamento dos dados para evitar erro no banco
    const payload = {
      ...body,
      id: undefined, // Não atualizamos o ID
      responsavel: undefined, // Não mudamos quem criou
      created_at: undefined,
      
      // Garante tipos corretos
      filial_id: body.filial_id ? parseInt(body.filial_id) : null,
      fornecedor_id: body.fornecedor_id ? parseInt(body.fornecedor_id) : null,
      valor: body.valor ? parseFloat(body.valor) : 0,
      data_vencimento: body.data_vencimento || null,
      
      // Garante que referências de outros sistemas sejam texto ou null
      fluig_id: body.fluig_id || null,
      numero_sc: body.numero_sc || null,
      numero_pedido: body.numero_pedido || null,
      numero_nota: body.numero_nota || null,
    };

    const { data, error } = await supabase
      .from('solicitacoes_compra')
      .update(payload)
      .eq('id', id)
      .select();

    if (error) throw error;

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error("Erro ao atualizar:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- DELETE: EXCLUIR UMA SOLICITAÇÃO ---
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