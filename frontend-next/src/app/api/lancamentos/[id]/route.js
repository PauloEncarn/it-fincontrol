import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// PUT: Atualizar Lançamento (Com correção de nomes das colunas)
export async function PUT(request, context) {
  try {
    const params = await context.params;
    const id = params.id;
    const body = await request.json();

    // Mapeamento MANUAL para garantir que os nomes batam com o banco
    const payload = {
      numero_nota: body.numero_nota,
      data_vencimento: body.data_vencimento,
      valor: parseFloat(body.valor),
      
      // Correção de nomes:
      arquivo_boleto: body.link_boleto || body.arquivo_boleto || null,
      observacao: body.observacoes || body.observacao || null, // Aceita plural ou singular e converte pro certo
      
      status_pagamento: body.status_pagamento,
      data_envio: body.data_envio === '' ? null : body.data_envio,
      
      // IDs
      fornecedor_id: parseInt(body.fornecedor_id),
      filial_id: parseInt(body.filial_id)
    };

    // Removemos campos que não podem ser nulos ou que não existem se vierem undefined
    if (!payload.data_envio) delete payload.data_envio; 

    console.log(`🔄 Atualizando ID ${id} com:`, payload);

    const { error } = await supabase
      .from('lancamentos')
      .update(payload)
      .eq('id', id);

    if (error) {
        console.error("Erro Update Supabase:", error);
        throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Excluir Lançamento
export async function DELETE(request, context) {
  try {
    const params = await context.params;
    const id = params.id;

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