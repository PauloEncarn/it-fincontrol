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

// --- PUT: ATUALIZAR NOTA ---
export async function PUT(request, context) {
  try {
    // 1. Ler o ID corretamente (Compatível com Next.js 15)
    const params = await context.params;
    const id = params.id;

    if (!id || id === 'undefined') {
        return NextResponse.json({ error: "ID Inválido" }, { status: 400 });
    }

    const body = await request.json();

    // 2. MONTAGEM MANUAL (WHITELIST)
    // Isso resolve dois problemas:
    // A) Ignora objetos aninhados (filial: {}) que o front manda e quebram o banco.
    // B) Garante que campos como contrato_usado sejam lidos explicitamente.

    const payload = {
      // IDs e Chaves
      filial_id: limparNumero(body.filial_id),
      fornecedor_id: limparNumero(body.fornecedor_id),
      contrato_id: limparNumero(body.contrato_id),
      competencia: limparTexto(body.competencia),
      
      // Dados Financeiros
      valor: limparNumero(body.valor) || 0,
      valor_previsto: limparNumero(body.valor_previsto),
      data_vencimento: limparTexto(body.data_vencimento),
      data_envio: limparTexto(body.data_envio),
      
      // Campos Específicos de Lançamento
      contrato_usado: limparTexto(body.contrato_usado),
      centro_custo_usado: limparTexto(body.centro_custo_usado),
      cnpj_usado: limparTexto(body.cnpj_usado),
      
      // Detalhes da Nota
      numero_nota: limparTexto(body.numero_nota),
      serie: limparTexto(body.serie),
      
      // Outros
      descricao_servico: limparTexto(body.descricao_servico),
      servico_protheus: limparTexto(body.servico_protheus),
      numero_medicao: limparTexto(body.numero_medicao),
      numero_pedido: limparTexto(body.numero_pedido),
      solicitacao_fluig: limparTexto(body.solicitacao_fluig),
      observacao: limparTexto(body.observacao),
      
      // Controle e Arquivos
      etapa: limparTexto(body.etapa) || 'pendente',
      status_pagamento: limparTexto(body.status_pagamento),
      arquivo_nota: limparTexto(body.arquivo_nota),
      arquivo_boleto: limparTexto(body.arquivo_boleto),
      // repetir_por: limparNumero(body.repetir_por) // Geralmente não se edita a repetição, mas se precisar, descomente
    };

    // 3. Atualizar no Banco
    const { data, error } = await supabase
      .from('lancamentos') // <--- CORREÇÃO AQUI: Era 'lancamentos_notas', mudamos para 'lancamentos'
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
      .from('lancamentos') // <--- CORREÇÃO AQUI TAMBÉM
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ message: "Excluído com sucesso" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
