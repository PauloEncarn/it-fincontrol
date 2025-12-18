import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// --- PUT: ATUALIZAR NOTA ---
export async function PUT(request, context) {
  try {
    const params = await context.params;
    const id = params.id;

    if (!id || id === 'undefined') {
        return NextResponse.json({ error: "ID Inválido" }, { status: 400 });
    }

    const body = await request.json();

    // MONTAGEM MANUAL (Para evitar erros de objeto e garantir persistência)
    const payload = {
      filial_id: body.filial_id ? parseInt(body.filial_id) : null,
      fornecedor_id: body.fornecedor_id ? parseInt(body.fornecedor_id) : null,
      valor: body.valor ? parseFloat(body.valor) : 0,
      
      data_vencimento: body.data_vencimento || null,
      data_envio: body.data_envio || null,
      
      // GARANTINDO OS CAMPOS QUE ESTAVAM SUMINDO 👇
      contrato_usado: body.contrato_usado || null,
      centro_custo_usado: body.centro_custo_usado || null,
      cnpj_usado: body.cnpj_usado || null,
      
      numero_nota: body.numero_nota,
      serie: body.serie,
      
      descricao_servico: body.descricao_servico,
      servico_protheus: body.servico_protheus,
      numero_medicao: body.numero_medicao,
      numero_pedido: body.numero_pedido,
      solicitacao_fluig: body.solicitacao_fluig,
      observacao: body.observacao,
      
      status_pagamento: body.status_pagamento,
      arquivo_nota: body.arquivo_nota,
      arquivo_boleto: body.arquivo_boleto
    };

    const { data, error } = await supabase
      .from('lancamentos_notas')
      .update(payload)
      .eq('id', id)
      .select();

    if (error) throw error;

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error("Erro no PUT Lançamentos:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- DELETE: EXCLUIR NOTA ---
export async function DELETE(request, context) {
  try {
    const params = await context.params;
    const id = params.id;

    if (!id || id === 'undefined') return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const { error } = await supabase
      .from('lancamentos_notas')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ message: "Excluído com sucesso" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}