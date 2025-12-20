import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Usamos a chave Service Role para ter permissão de ADMIN no banco
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// O segundo parâmetro { params } pega o ID da URL (ex: usuarios/15)
export async function PUT(request, { params }) {
  try {
    const id = params.id;
    const body = await request.json();

    // Validar se mandou o status novo
    if (typeof body.ativo !== 'boolean') {
        return NextResponse.json({ error: "O campo 'ativo' deve ser booleano" }, { status: 400 });
    }

    // Atualiza no banco
    const { data, error } = await supabase
      .from('usuarios')
      .update({ ativo: body.ativo })
      .eq('id', id)
      .select();

    if (error) {
        throw error;
    }

    return NextResponse.json(data[0]);

  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Opcional: Permitir DELETE (Excluir usuário)
export async function DELETE(request, { params }) {
    try {
        const id = params.id;
        const { error } = await supabase.from('usuarios').delete().eq('id', id);
        
        if (error) throw error;
        
        return NextResponse.json({ message: "Usuário excluído com sucesso" });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}