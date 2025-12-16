import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt'; // Importamos a criptografia

// GET: Listar usuários
export async function GET(request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Por segurança, não vamos retornar a coluna password na listagem
  const { data: users, error } = await supabase.from('usuarios').select('id, username, nome_completo, cpf, setor, cargo');

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

    // --- A MÁGICA DA SEGURANÇA AQUI ---
    // O número 10 é o "custo" da criptografia (quanto maior, mais seguro e mais lento)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insere na tabela com a senha criptografada
    const { error } = await supabase
      .from('usuarios')
      .insert([{ 
        username, 
        password: hashedPassword, // Salva o hash, não o texto puro
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