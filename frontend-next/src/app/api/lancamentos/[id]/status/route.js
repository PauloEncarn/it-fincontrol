import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function PATCH(request, context) {
  try {
    // No Next.js 15, params é uma Promise, então usamos await
    const params = await context.params;
    const id = params.id; // O ID vem da pasta pai [id]

    const body = await request.json();

    console.log(`🔄 [Status] Atualizando ID ${id}:`, body);

    // Flexibilidade para ler o status
    let novoStatus = body.status_pagamento || body.status;

    // Converte boleano se necessário
    if (novoStatus === true) novoStatus = 'Pago';
    if (novoStatus === false) novoStatus = 'Pendente';

    if (!novoStatus) {
        return NextResponse.json({ error: 'Status não informado' }, { status: 400 });
    }

    // Atualiza no Banco
    const { error } = await supabase
      .from('lancamentos')
      .update({ status_pagamento: novoStatus })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("🔥 Erro Status:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}