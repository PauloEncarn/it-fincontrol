import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET: Listar usuários
export async function GET(request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: users, error } = await supabase.from('usuarios').select('*');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(users);
}

// POST: Criar novo usuário
export async function POST(request) {
  try {
    const data = await request.json();
    const { username, password, nome_completo, cpf, setor, cargo } = data;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Verifica se já existe
    const { data: existing } = await supabase
      .from('usuarios')
      .select('id')
      .eq('username', username)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Usuário já existe' }, { status: 400 });
    }

    // Insere na tabela 'usuarios'
    const { error } = await supabase
      .from('usuarios')
      .insert([{ 
        username, 
        password, // Salvando senha texto puro (conforme seu padrão atual)
        nome_completo, 
        cpf, 
        setor, 
        cargo 
      }]);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}