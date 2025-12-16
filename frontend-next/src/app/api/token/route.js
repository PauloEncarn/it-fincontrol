import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const username = formData.get('username'); 
    const password = formData.get('password'); // Senha digitada (Carper@153)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Buscar usuário no banco
    const { data: usuario, error } = await supabase
      .from('usuarios') 
      .select('*')
      .eq('username', username)
      .single();

    if (error || !usuario) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 401 });
    }

    // 2. Verificar a senha COM CRIPTOGRAFIA
    // O bcrypt pega o 'Carper@153', faz a matemática e vê se bate com o '$2a$12...'
    const passwordMatch = await bcrypt.compare(password, usuario.password);

    if (!passwordMatch) {
      console.log("Senha incorreta (Hash não bateu)");
      return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 });
    }

    // 3. Sucesso!
    const fakeToken = Buffer.from(`${usuario.username}:${Date.now()}`).toString('base64');

    return NextResponse.json({ 
      access_token: fakeToken, 
      user: {
        id: usuario.id,
        nome: usuario.nome_completo,
        username: usuario.username,
        cargo: usuario.cargo || 'User',
        setor: usuario.setor || 'Geral'
      } 
    });

  } catch (error) {
    console.error("Erro no Login:", error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}