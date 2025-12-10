import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// EDITAR (PUT)
export async function PUT(request, props) {
  try {
    // 1. CORREÇÃO: Await no params
    const params = await props.params;
    const id = parseInt(params.id);

    const data = await request.json();
    console.log(`🔄 Editando Lançamento ID: ${id}`, data);

    // 2. Preparar dados (igual ao POST, mas sem ID)
    const cleanData = {
      filial_id: parseInt(data.filial_id),
      fornecedor_id: parseInt(data.fornecedor_id),
      valor: parseFloat(data.valor),
      numero_nota: String(data.numero_nota),
      
      data_vencimento: new Date(data.data_vencimento),
      data_envio: data.data_envio ? new Date(data.data_envio) : null,
      
      cnpj_usado: data.cnpj_usado || null,
      contrato_usado: data.contrato_usado || null,
      centro_custo_usado: data.centro_custo_usado || null,
      serie: data.serie || 'U',
      descricao_servico: data.descricao_servico || null,
      servico_protheus: data.servico_protheus || null,
      numero_medicao: data.numero_medicao || null,
      numero_pedido: data.numero_pedido || null,
      solicitacao_fluig: data.solicitacao_fluig || null,
      observacao: data.observacao || null,
      status_pagamento: data.status_pagamento,
      arquivo_nota: data.arquivo_nota,
      arquivo_boleto: data.arquivo_boleto,
      
      // IMPORTANTE: Removemos campos de relação para não dar erro
      id: undefined,
      filial: undefined,
      fornecedor: undefined,
      updated_at: new Date()
    };

    const atualizado = await prisma.lancamentos.update({
      where: { id },
      data: cleanData
    });

    return NextResponse.json(atualizado);

  } catch (error) {
    console.error("❌ ERRO AO EDITAR LANÇAMENTO:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETAR (DELETE) - Caso precise futuramente
export async function DELETE(request, props) {
  try {
    const params = await props.params;
    const id = parseInt(params.id);

    await prisma.lancamentos.delete({ where: { id } });
    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}