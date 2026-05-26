import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// --- HELPER: Limpeza de Dados ---
const limparNumero = (valor) => {
  if (valor === null || valor === undefined) return null;
  const stringVal = String(valor).trim();
  if (stringVal === '' || stringVal === 'undefined' || stringVal === 'null' || stringVal === 'NaN') return null;
  const numero = parseFloat(stringVal);
  return isNaN(numero) ? null : numero;
};

const limparTexto = (valor) => {
  if (valor === null || valor === undefined) return null;
  const stringVal = String(valor).trim();
  if (stringVal === '' || stringVal === 'undefined' || stringVal === 'null') return null;
  return stringVal;
};

// --- PUT: ATUALIZAR ---
// ⚠️ Note que mudamos a forma de receber os parâmetros para funcionar no Next.js 15
export async function PUT(request, context) {
  try {
    // 1. Ler o ID com await (compatível com Next.js 15)
    const params = await context.params;
    const id = params.id;
    
    // Debug: ver no terminal do VS Code o que está chegando
    console.log("Tentando editar ID:", id);

    // 2. Validação do ID
    if (!id || id === 'undefined' || id === 'null') {
       return NextResponse.json({ error: "ID Inválido na URL" }, { status: 400 });
    }

    const body = await request.json();

    // 3. Montagem do Payload (Blindado)
    const payload = {
      filial_id: limparNumero(body.filial_id),
      fornecedor_id: limparNumero(body.fornecedor_id),
      valor: limparNumero(body.valor) || 0,
      data_vencimento: limparTexto(body.data_vencimento),
      
      solicitante: limparTexto(body.solicitante),
      cnpj: limparTexto(body.cnpj),
      condicao_pagamento: limparTexto(body.condicao_pagamento),
      numero_sc: limparTexto(body.numero_sc),
      numero_pedido: limparTexto(body.numero_pedido),
      servico: limparTexto(body.servico),
      servico_protheus: limparTexto(body.servico_protheus),
      centro_custo: limparTexto(body.centro_custo),
      numero_nota: limparTexto(body.numero_nota),
      fluig_id: limparTexto(body.fluig_id),
      status: limparTexto(body.status) || 'Pendente',
      observacao: limparTexto(body.observacao)
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
export async function DELETE(request, context) {
  try {
    const params = await context.params;
    const id = params.id;

    if (!id || id === 'undefined') return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const { error } = await supabase.from('solicitacoes_compra').delete().eq('id', id);

    if (error) throw error;
    return NextResponse.json({ message: "Excluído com sucesso" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}