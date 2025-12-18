import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// --- FUNÇÃO DE SEGURANÇA PARA NÚMEROS ---
// Transforma "undefined", "null", "", ou NaN em null.
// Transforma "123" em 123.
const safeInt = (valor) => {
  if (valor === undefined || valor === null || valor === 'undefined' || valor === '') {
    return null;
  }
  const numero = parseInt(valor);
  return isNaN(numero) ? null : numero;
};

// --- PUT: ATUALIZAR ---
export async function PUT(request, { params }) {
  try {
    const { id } = params; 
    const body = await request.json();

    // 1. Limpeza de Objetos (Remove o que não deve ser salvo)
    const { 
      id: idCorpo, 
      created_at, 
      responsavel, 
      filial,      // Remove objeto
      fornecedor,  // Remove objeto
      ...dados 
    } = body;

    // 2. Montagem Segura do Payload
    const payload = {
      ...dados,
      
      // Usa o safeInt para evitar o erro "undefined"
      filial_id: safeInt(body.filial_id),
      fornecedor_id: safeInt(body.fornecedor_id),
      
      // Tratamento de valores monetários
      valor: body.valor ? parseFloat(body.valor) : 0,
      
      // Tratamento de Datas (string vazia vira null)
      data_vencimento: body.data_vencimento || null,
      
      // Tratamento de Textos Opcionais
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