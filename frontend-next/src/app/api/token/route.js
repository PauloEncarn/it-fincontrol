import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
console.log("DEBUG ENV:", {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  hasKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY, // Retorna true se tiver chave, false se não
  keyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length // Retorna o tamanho da chave
});

    const formData = await request.formData();
    const username = formData.get('username'); 
    const password = formData.get('password');

    // Conectar com a chave Service Role (Admin) para ler a tabela de usuários
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Buscar na tabela 'usuarios'
    const { data: usuario, error } = await supabase
      .from('usuarios') 
      .select('*')
      .eq('username', username) // Confirme se a coluna no banco chama 'username'
      .single();

    // 2. Se não achar ou der erro
    if (error || !usuario) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 401 });
    }

    // 3. Verificar a senha (Comparação direta de texto)
    if (usuario.password !== password) {
      return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 });
    }

    // 4. Gerar um token simples (Base64) para o frontend achar que está logado
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