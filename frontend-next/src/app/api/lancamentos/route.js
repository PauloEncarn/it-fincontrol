import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// PUT: Atualizar Lançamento Completo
export async function PUT(request, context) {
  try {
    const { id } = context.params;
    const body = await request.json();

    // LIMPEZA CRÍTICA:
    // O frontend costuma mandar o objeto completo de volta (com fornecedor: {nome...}).
    // O Supabase não aceita isso no update. Ele quer só fornecedor_id.
    const payload = { ...body };

    // Removemos objetos relacionados e o próprio ID
    delete payload.fornecedor;
    delete payload.filial;
    delete payload.id;
    delete payload.created_at; // Geralmente não se atualiza data de criação

    // Ajuste de datas vazias para null
    if (payload.data_envio === '') payload.data_envio = null;
    if (payload.data_emissao === '') payload.data_emissao = null;
    if (payload.data_pagamento === '') payload.data_pagamento = null;

    const { error } = await supabase
      .from('lancamentos')
      .update(payload)
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao atualizar:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Excluir
export async function DELETE(request, context) {
  try {
    const { id } = context.params;
    const { error } = await supabase.from('lancamentos').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}