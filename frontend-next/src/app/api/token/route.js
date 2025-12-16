import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const usernameInput = formData.get('username'); // O que você digitou
    const passwordInput = formData.get('password');

    console.log(`🔍 Tentativa de login para: "${usernameInput}"`);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Buscar usuário
    const { data: usuario, error } = await supabase
      .from('usuarios') 
      .select('*')
      .eq('username', usernameInput)
      .single();

    // LOG DETALHADO (Vai aparecer no painel da Vercel)
    if (error) {
        console.error("❌ Erro ao buscar no banco:", error.message, error.details);
    } else {
        console.log("✅ Usuário encontrado no banco:", usuario ? usuario.username : "Nenhum");
    }

    // 2. Verificações
    if (error || !usuario) {
      console.log("⛔ Bloqueio: Usuário não encontrado.");
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 401 });
    }

    if (usuario.password !== passwordInput) {
      console.log(`⛔ Bloqueio: Senha incorreta. (Banco: ${usuario.password} | Digitado: ${passwordInput})`);
      return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 });
    }

    console.log("🚀 Login Aprovado!");

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
    console.error("🔥 Erro Interno:", error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}