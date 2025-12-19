import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// --- HELPER: Limpeza ---
const limparTexto = (valor) => {
    if (!valor) return null;
    const s = String(valor).trim();
    return s === '' || s === 'undefined' || s === 'null' ? null : s;
};

// --- GET: Listar Solicitações ---
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const busca = searchParams.get('busca');

    // 1. Inicia a Query
    // O segredo aqui é o .select() pegando as tabelas relacionadas
    let query = supabase
      .from('solicitacoes_compra') // Verifique se o nome da tabela no Supabase é este mesmo
      .select(`
        *,
        filial:filiais(id, nome_fantasia, codigo),
        fornecedor:fornecedores(id, nome_empresa)
      `)
      .order('created_at', { ascending: false }); // As mais recentes primeiro

    // 2. Filtro de Busca (Se tiver)
    if (busca) {
      // Busca em colunas de texto e nas relações
      const termo = `%${busca}%`;
      query = query.or(`solicitante.ilike.${termo},numero_sc.ilike.${termo},numero_pedido.ilike.${termo},servico.ilike.${termo},status.ilike.${termo}`);
      
      // Dica: Buscar dentro de relação no Supabase é mais chato, então focamos nas colunas principais primeiro
    }

    const { data, error } = await query;

    if (error) {
        console.error("Erro Supabase GET Solicitacoes:", error);
        throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- POST: Criar Solicitação ---
export async function POST(request) {
  try {
    const body = await request.json();

    // Validação mínima
    if (!body.filial_id || !body.solicitante) {
        return NextResponse.json({ error: "Filial e Solicitante são obrigatórios" }, { status: 400 });
    }

    // Tratamento dos dados para evitar erros de tipo
    const payload = {
      filial_id: body.filial_id,
      fornecedor_id: body.fornecedor_id || null, // Pode ser nulo
      solicitante: limparTexto(body.solicitante),
      cnpj: limparTexto(body.cnpj),
      condicao_pagamento: limparTexto(body.condicao_pagamento),
      valor: body.valor ? parseFloat(body.valor) : 0,
      numero_sc: limparTexto(body.numero_sc),
      numero_pedido: limparTexto(body.numero_pedido),
      servico: limparTexto(body.servico),
      servico_protheus: limparTexto(body.servico_protheus),
      centro_custo: limparTexto(body.centro_custo),
      numero_nota: limparTexto(body.numero_nota),
      fluig_id: limparTexto(body.fluig_id),
      data_vencimento: body.data_vencimento || null,
      status: body.status || 'Pendente',
      observacao: limparTexto(body.observacao)
    };

    const { data, error } = await supabase
      .from('solicitacoes_compra')
      .insert([payload])
      .select();

    if (error) throw error;

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error("Erro POST Solicitacoes:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}