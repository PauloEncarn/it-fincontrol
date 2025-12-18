import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// --- PUT: ATUALIZAR ---
export async function PUT(request, { params }) {
  try {
    const { id } = params; // Pega o ID da URL (esse é o que vale)
    const body = await request.json();

    // 1. REMOVE O ID DE DENTRO DOS DADOS (Para não tentar alterar a chave primária)
    const { id: idDoBody, created_at, responsavel, ...dadosEditaveis } = body;

    // 2. Monta o payload seguro
    const payload = {
      ...dadosEditaveis,
      
      // Garante tipos corretos (igual fizemos no POST)
      filial_id: body.filial_id ? parseInt(body.filial_id) : null,
      fornecedor_id: body.fornecedor_id ? parseInt(body.fornecedor_id) : null,
      valor: body.valor ? parseFloat(body.valor) : 0,
      data_vencimento: body.data_vencimento || null,
      
      // Garante strings ou null
      fluig_id: body.fluig_id || null,
      numero_sc: body.numero_sc || null,
      numero_pedido: body.numero_pedido || null,
      numero_nota: body.numero_nota || null,
    };

    const { data, error } = await supabase
      .from('solicitacoes_compra')
      .update(payload)
      .eq('id', id) // Usa o ID da URL para achar qual atualizar
      .select();

    if (error) throw error;

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error("Erro ao atualizar:", error);
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