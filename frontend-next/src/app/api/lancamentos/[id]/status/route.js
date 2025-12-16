import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// PUT: Atualizar APENAS o Status
export async function PUT(request, context) {
  try {
    const { id } = context.params;
    const body = await request.json();

    console.log(`🔄 Atualizando status do ID ${id}:`, body);

    // Montamos o objeto de atualização
    const updateData = {
      status_pagamento: body.status_pagamento
    };

    // Se estiver marcando como Pago, pode ser que o front mande data_pagamento
    // Se estiver voltando para Pendente, talvez queira limpar a data_pagamento (opcional)
    if (body.data_pagamento !== undefined) {
       updateData.data_pagamento = body.data_pagamento || null;
    }

    const { error } = await supabase
      .from('lancamentos')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error("Erro Supabase:", error);
      throw error;
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}