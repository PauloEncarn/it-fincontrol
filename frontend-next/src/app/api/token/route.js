import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const username = formData.get('username'); 
    const password = formData.get('password'); 

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Buscar usuário
    const { data: usuario, error } = await supabase
      .from('usuarios') 
      .select('*')
      .eq('username', username)
      .single();

    if (error || !usuario) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 401 });
    }

    // Verificar senha (Lendo da coluna password_hash)
    const passwordMatch = await bcrypt.compare(password, usuario.password_hash); // <--- AJUSTADO AQUI TAMBÉM

    if (!passwordMatch) {
      return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 });
    }

    // Sucesso
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
    console.error("Erro Login:", error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}