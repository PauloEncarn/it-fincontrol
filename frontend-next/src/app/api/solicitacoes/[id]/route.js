import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper para limpar números
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

    // ⚠️ AQUI ESTÁ A SOLUÇÃO DEFINITIVA
    // Em vez de usar "...body" (que traz lixo junto),
    // nós criamos o objeto APENAS com os campos que existem no banco.
    
    const payload = {
      // IDs (usando safeInt para evitar erro 22P02)
      filial_id: safeInt(body.filial_id),
      fornecedor_id: safeInt(body.fornecedor_id),
      
      // Textos Básicos
      solicitante: body.solicitante,
      cnpj: body.cnpj,
      condicao_pagamento: body.condicao_pagamento,
      
      // Valores Numéricos
      valor: body.valor ? parseFloat(body.valor) : 0,
      
      // Detalhes
      numero_sc: body.numero_sc,
      numero_pedido: body.numero_pedido,
      servico: body.servico,
      servico_protheus: body.servico_protheus,
      centro_custo: body.centro_custo,
      
      // Controle Externo
      numero_nota: body.numero_nota,
      fluig_id: body.fluig_id,
      
      // Datas e Status
      data_vencimento: body.data_vencimento || null,
      status: body.status,
      observacao: body.observacao
    };

    // Agora o payload está 100% limpo, sem o objeto 'filial' ou 'fornecedor'
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