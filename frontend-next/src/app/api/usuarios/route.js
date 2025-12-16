import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const { data, error } = await supabase.from('usuarios').select('id, username, nome_completo, setor, cargo');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password, nome_completo, cpf, setor, cargo } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // Criptografar
    const hashedPassword = await bcrypt.hash(password, 10);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Inserir no Banco
    const { error } = await supabase
      .from('usuarios')
      .insert([{ 
        username, 
        password_hash: hashedPassword, // <--- AQUI ESTAVA O ERRO! Agora aponta para a coluna certa.
        nome_completo, 
        cpf, 
        setor, 
        cargo 
      }]);

    if (error) {
      console.error("Erro Supabase:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}