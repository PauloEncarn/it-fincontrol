import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const username = formData.get('username'); 
    const password = formData.get('password');

    // Conectar com permissão de Admin (Service Role) para ler a tabela de usuários
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Buscar o usuário na tabela 'usuarios' pelo username
    // IMPORTANTE: Verifique se o nome da coluna no seu banco é 'username' ou 'login' ou 'email'
    const { data: usuario, error } = await supabase
      .from('usuarios') 
      .select('*')
      .eq('username', username) // <--- Se sua coluna chamar 'login', mude aqui para .eq('login', username)
      .single();

    // 2. Verificar se usuário existe
    if (error || !usuario) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 401 });
    }

    // 3. Verificar a senha
    // ATENÇÃO: Aqui estou comparando texto puro (igual ao sistema antigo).
    // Se no banco a senha estiver criptografada, a lógica muda.
    if (usuario.password !== password) {
      return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 });
    }

    // 4. Sucesso! Retornar um "token" falso mas funcional
    // Como não estamos usando o Auth do Supabase, geramos um token simples
    // para o frontend achar que está logado.
    const fakeToken = Buffer.from(`${usuario.username}:${Date.now()}`).toString('base64');

    return NextResponse.json({ 
      access_token: fakeToken, 
      user: {
        id: usuario.id,
        nome: usuario.nome_completo, // Ajuste conforme coluna do banco
        username: usuario.username
      } 
    });

  } catch (error) {
    console.error("Erro no Login:", error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}