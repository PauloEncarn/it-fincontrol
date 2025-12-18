import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// --- FUNÇÕES DE LIMPEZA (SANITIZERS) ---

// Transforma qualquer coisa estranha em NULL ou NÚMERO VÁLIDO
const limparNumero = (valor) => {
  // Se for nulo real ou undefined real
  if (valor === null || valor === undefined) return null;
  
  // Se for string, verifica se é lixo
  const stringVal = String(valor).trim();
  if (stringVal === '' || stringVal === 'undefined' || stringVal === 'null' || stringVal === 'NaN') {
    return null;
  }

  // Tenta converter
  const numero = parseFloat(stringVal);
  return isNaN(numero) ? null : numero;
};

// Transforma "undefined" (texto) em NULL ou TEXTO VÁLIDO
const limparTexto = (valor) => {
  if (valor === null || valor === undefined) return null;
  const stringVal = String(valor).trim();
  if (stringVal === '' || stringVal === 'undefined' || stringVal === 'null') {
    return null;
  }
  return stringVal;
};

// --- PUT: ATUALIZAR ---
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    
    // Proteção contra ID inválido na URL
    if (!id || id === 'undefined' || id === 'null') {
       return NextResponse.json({ error: "ID Inválido" }, { status: 400 });
    }

    const body = await request.json();

    // --- MONTAGEM BLINDADA DO PAYLOAD ---
    // Aqui nós ignoramos completamente o que não queremos (como objetos 'filial': {...})
    // E limpamos o que queremos.
    
    const payload = {
      // IDs (Chaves estrangeiras)
      filial_id: limparNumero(body.filial_id),
      fornecedor_id: limparNumero(body.fornecedor_id),
      
      // Valores Monetários
      valor: limparNumero(body.valor) || 0, // Se for null, vira 0

      // Datas
      data_vencimento: limparTexto(body.data_vencimento), // Supabase aceita null ou string de data

      // Campos de Texto
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

    // Atualiza no banco
    const { data, error } = await supabase
      .from('solicitacoes_compra')
      .update(payload)
      .eq('id', id)
      .select();

    if (error) throw error;

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error("Erro no PUT (Backend Blindado):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- DELETE: EXCLUIR ---
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    if (!id || id === 'undefined') return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const { error } = await supabase.from('solicitacoes_compra').delete().eq('id', id);

    if (error) throw error;
    return NextResponse.json({ message: "Excluído com sucesso" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}