import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function PUT(request, { params }) {
  try {
    // --- CORREÇÃO IMPORTANTE PARA NEXT.JS 15 ---
    // O params agora é uma Promise, precisamos do await
    const { id } = await params; 

    const body = await request.json();

    console.log(`🔄 Tentando atualizar Usuário ID: ${id}`);
    console.log(`📝 Dados recebidos:`, body);

    // Validação de segurança
    if (!id || id === 'undefined') {
        return NextResponse.json({ error: "ID do usuário inválido" }, { status: 400 });
    }

    if (typeof body.ativo !== 'boolean') {
        return NextResponse.json({ error: "O campo 'ativo' deve ser booleano" }, { status: 400 });
    }

    // Atualiza no banco
    const { data, error } = await supabase
      .from('usuarios')
      .update({ ativo: body.ativo })
      .eq('id', id)
      .select();

    if (error) throw error;

    return NextResponse.json(data[0]);

  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}