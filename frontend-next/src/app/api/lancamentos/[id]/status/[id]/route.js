import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function PUT(request, context) {
  try {
    const params = await context.params;
    const id = params.id;
    
    const body = await request.json();

    console.log(`🔍 [Status] Recebido para ID ${id}:`, body);

    // 1. Tenta adivinhar qual campo o frontend enviou
    // Às vezes o front manda { status: "Pago" } ou { status_pagamento: "Pago" }
    let novoStatus = body.status_pagamento || body.status || body.novoStatus;

    // 2. Se o frontend mandou Boleano (true/false) em vez de texto
    if (novoStatus === true) novoStatus = 'Pago';
    if (novoStatus === false) novoStatus = 'Pendente';

    if (!novoStatus) {
        console.error("❌ [Status] Nenhum status válido encontrado no corpo da requisição.");
        return NextResponse.json({ error: 'Status não informado' }, { status: 400 });
    }

    // 3. Atualiza no Banco
    const { error } = await supabase
      .from('lancamentos')
      .update({ status_pagamento: novoStatus })
      .eq('id', id);

    if (error) {
      console.error("❌ [Status] Erro Supabase:", error);
      throw error;
    }

    console.log(`✅ [Status] Atualizado para: ${novoStatus}`);
    return NextResponse.json({ success: true, novo_status: novoStatus });

  } catch (error) {
    console.error("🔥 [Status] Erro Geral:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}