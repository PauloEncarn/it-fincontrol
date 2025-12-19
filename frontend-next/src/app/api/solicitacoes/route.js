import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// --- GET: LISTAR TODAS ---
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const busca = searchParams.get('busca');

    let query = supabase
      .from('solicitacoes_compra')
      .select(`
        *,
        filial:filiais(nome_fantasia, codigo),
        fornecedor:fornecedores(nome_empresa)
      `)
      .order('id', { ascending: false });

    if (busca) {
      query = query.or(`numero_sc.ilike.%${busca}%,numero_pedido.ilike.%${busca}%,servico.ilike.%${busca}%,solicitante.ilike.%${busca}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- POST: CRIAR NOVA (Corrigido e Blindado) ---
export async function POST(request) {
  try {
    // 1. Autenticação
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    let nomeResponsavel = 'Sistema';
    
    if (token) {
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
            nomeResponsavel = user.user_metadata.nome_completo || user.user_metadata.username || user.email;
        }
    }

    const body = await request.json();
    
    // 2. MONTAGEM MANUAL (WHITELIST)
    // Aqui nós escolhemos EXATAMENTE o que entra no banco.
    // O campo 'contrato' será ignorado aqui, pois não o incluímos na lista.
    
    const payload = {
      responsavel: nomeResponsavel, // Gerado pelo sistema

      // Chaves Estrangeiras (Convertendo para garantir número)
      filial_id: body.filial_id ? parseInt(body.filial_id) : null,
      fornecedor_id: body.fornecedor_id ? parseInt(body.fornecedor_id) : null,
      
      // Valores
      valor: body.valor ? parseFloat(body.valor) : 0,
      
      // Datas
      data_vencimento: body.data_vencimento || null,
      
      // Campos de Texto (SOMENTE OS QUE EXISTEM NO BANCO)
      // Note que NÃO colocamos 'contrato' aqui.
      solicitante: body.solicitante,
      cnpj: body.cnpj,
      condicao_pagamento: body.condicao_pagamento,
      centro_custo: body.centro_custo,
      
      numero_sc: body.numero_sc,
      numero_pedido: body.numero_pedido,
      servico: body.servico,
      servico_protheus: body.servico_protheus,
      
      numero_nota: body.numero_nota,
      fluig_id: body.fluig_id,
      
      status: body.status || 'Pendente',
      observacao: body.observacao
    };

    const { data, error } = await supabase
      .from('solicitacoes_compra')
      .insert([payload])
      .select();

    if (error) throw error;

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error("Erro no POST Solicitacoes:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}