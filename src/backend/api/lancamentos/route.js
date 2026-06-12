import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// --- GET: LISTAR NOTAS (BUSCA INTELIGENTE) ---
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const busca = searchParams.get('busca');

    // 1. Inicia a query básica
    let query = supabase
      .from('lancamentos')
      .select(`
        *,
        filial:filiais(nome_fantasia, codigo),
        fornecedor:fornecedores(nome_empresa)
      `)
      .order('id', { ascending: false });

    // 2. Lógica de Busca Avançada
    if (busca) {
      // Lista de campos de TEXTO para pesquisar
      // (Adicionei contrato_usado, cnpj_usado, numero_nota, pedido, descrição e observação)
      let filtros = `numero_nota.ilike.%${busca}%,contrato_usado.ilike.%${busca}%,cnpj_usado.ilike.%${busca}%,descricao_servico.ilike.%${busca}%,numero_pedido.ilike.%${busca}%,observacao.ilike.%${busca}%`;

      // Verificação especial para VALOR (Numérico)
      // Se o usuário digitou um número válido (ex: 150.50), adicionamos a busca na coluna 'valor'
      const valorNumerico = parseFloat(busca);
      if (!isNaN(valorNumerico)) {
        // Adiciona condição OR valor = X
        filtros += `,valor.eq.${valorNumerico}`;
      }

      query = query.or(filtros);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
// --- POST: CRIAR NOTA ---
export async function POST(request) {
  try {
    const body = await request.json();
    
    // MONTAGEM DO PAYLOAD
    const payload = {
      // IDs e Chaves
      filial_id: body.filial_id ? parseInt(body.filial_id) : null,
      fornecedor_id: body.fornecedor_id ? parseInt(body.fornecedor_id) : null,
      contrato_id: null,
      competencia: body.competencia || null,
      
      // Dados Financeiros
      valor: body.valor ? parseFloat(body.valor) : 0,
      valor_previsto: body.valor_previsto ? parseFloat(body.valor_previsto) : null,
      data_vencimento: body.data_vencimento || null,
      data_envio: body.data_envio || null,
      
      // Campos "Usado" (Esses devem existir na tabela 'lancamentos')
      contrato_usado: body.contrato_usado || null,
      centro_custo_usado: body.centro_custo_usado || null,
      cnpj_usado: body.cnpj_usado || null,
      
      // Detalhes
      numero_nota: body.numero_nota,
      serie: body.serie,
      
      // Outros
      descricao_servico: body.descricao_servico,
      servico_protheus: body.servico_protheus,
      numero_medicao: body.numero_medicao,
      numero_pedido: body.numero_pedido,
      solicitacao_fluig: body.solicitacao_fluig,
      observacao: body.observacao,
      
      // Controle
      status_pagamento: body.status_pagamento || 'Pendente Nota',
      arquivo_nota: body.arquivo_nota,
      arquivo_boleto: body.arquivo_boleto,
      repetir_por: body.repetir_por
    };

    const { data, error } = await supabase
      .from('lancamentos') // <--- CORRIGIDO: Era 'lancamentos_notas'
      .insert([payload])
      .select();

    if (error) throw error;

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error("Erro no POST Lançamentos:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
