import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    console.log("📥 Recebendo pedido de login...");

    // 1. Validar Variáveis de Ambiente
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("❌ ERRO CRÍTICO: Variáveis do Supabase não encontradas!");
      throw new Error("Configuração do servidor incompleta (Env Vars missing).");
    }

    // 2. Receber dados
    const formData = await request.formData();
    const email = formData.get('username'); 
    const password = formData.get('password');

    console.log(`👤 Tentando logar usuário: ${email}`);

    // 3. Conectar no Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // 4. Fazer Login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      console.error("⛔ Erro do Supabase:", error.message);
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.log("✅ Login com sucesso!");
    
    // 5. Retornar Token
    return NextResponse.json({ 
      access_token: data.session.access_token, 
      user: data.user 
    });

  } catch (error) {
    console.error("🔥 Erro Interno (500):", error);
    // Retorna o erro detalhado para o frontend (apenas para debug agora)
    return NextResponse.json({ 
      error: 'Erro interno no servidor', 
      details: error.message 
    }, { status: 500 });
  }
}