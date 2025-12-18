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

// --- POST: CRIAR NOVA ---
export async function POST(request) {
  try {
    // 1. Tenta pegar o usuário logado para ser o Responsável
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    
    let nomeResponsavel = 'Sistema'; // Valor padrão caso falhe a auth
    
    if (token) {
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
            nomeResponsavel = user.user_metadata.nome_completo || user.user_metadata.username || user.email;
        }
    }

    const body = await request.json();
    
    // 2. Monta o objeto para salvar
    const payload = {
      ...body,
      id: undefined, // Remove ID para o banco gerar
      responsavel: nomeResponsavel,
      
      // Converte números para evitar erro de tipo
      filial_id: body.filial_id ? parseInt(body.filial_id) : null,
      fornecedor_id: body.fornecedor_id ? parseInt(body.fornecedor_id) : null,
      valor: body.valor ? parseFloat(body.valor) : 0,
      data_vencimento: body.data_vencimento || null,
    };

    const { data, error } = await supabase
      .from('solicitacoes_compra')
      .insert([payload])
      .select();

    if (error) throw error;

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error("Erro no POST:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}