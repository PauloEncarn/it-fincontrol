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

    console.log(`🔄 Alterando Status ID ${id} para:`, body.status_pagamento);

    // Como sua tabela NÃO tem coluna 'data_pagamento', atualizamos apenas o status.
    const updateData = {
      status_pagamento: body.status_pagamento
    };

    const { error } = await supabase
      .from('lancamentos')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error("Erro Update Status:", error);
      throw error;
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}