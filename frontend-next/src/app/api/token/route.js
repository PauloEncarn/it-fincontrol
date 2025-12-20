import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SignJWT } from 'jose';
import { compare } from 'bcryptjs'; // <--- Importante

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    let username, password;
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        const body = await request.json();
        username = body.username;
        password = body.password;
    } else {
        const formData = await request.formData();
        username = formData.get('username');
        password = formData.get('password');
    }

    // 1. Busca o usuário
    const { data: user, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !user) {
        return NextResponse.json({ error: "Usuário não encontrado." }, { status: 401 });
    }

    // 2. VERIFICAÇÃO DE SENHA COM BCRYPT ✅
    // O banco tem o hash na coluna 'password_hash' (ou 'password', vamos garantir pegando o que tiver valor)
    const hashDoBanco = user.password_hash || user.password;

    if (!hashDoBanco) {
        // Se o usuário não tiver senha definida
        return NextResponse.json({ error: "Senha não definida para este usuário." }, { status: 401 });
    }

    // A mágica acontece aqui: O bcrypt compara o texto 'Carper@153' com o hash do banco
    const senhaCorreta = await compare(password, hashDoBanco);

    if (!senhaCorreta) {
        console.log("🚫 Senha inválida (bcrypt não bateu)");
        return NextResponse.json({
          
      error: "Senha incorreta. Verifique suas credenciais." // <--- AQUI
    }, { status: 401 });
    }

    // 3. Verificação de Ativo
    if (user.ativo === false) {
      
        return NextResponse.json({ 
          
          error: "Acesso bloqueado. Entre em contato com o Administrador." // <--- AQUI
    }, { status: 403 });
    }

    // 4. Gera Token
    const secret = new TextEncoder().encode(process.env.SUPABASE_SERVICE_ROLE_KEY || 'segredo');
    const token = await new SignJWT({ 
        sub: user.id, 
        username: user.username, 
        nome: user.nome_completo,
        nivel: user.cargo 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('8h')
      .sign(secret);

    return NextResponse.json({ access_token: token });

  } catch (error) {
    console.error("Erro Login:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}