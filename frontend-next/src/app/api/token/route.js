import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SignJWT } from 'jose';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    // 1. Tenta ler tanto JSON quanto FormData (pra garantir)
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

    console.log("🔍 --- INÍCIO DEBUG LOGIN ---");
    console.log(`👤 Usuário enviado: "${username}"`);
    console.log(`🔑 Senha enviada: "${password}"`);

    // 2. Busca o usuário
    const { data: user, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !user) {
        console.log("❌ Usuário não encontrado no banco ou erro:", error);
        return NextResponse.json({ error: "Usuário não encontrado." }, { status: 401 });
    }

    console.log("🗄️ Dados vindos do banco:", user);
    console.log(`🆚 Comparando: "${password}" (Input) == "${user.senha}" (Banco.senha) OU "${user.password}" (Banco.password)`);

    // 3. Verificação de Senha (com Trim para ignorar espaços extras)
    const senhaBanco = user.senha || user.password; // Tenta pegar de uma coluna ou outra
    
    // Converte tudo para string e remove espaços para evitar erros bobos
    const senhaInputLimpa = String(password).trim();
    const senhaBancoLimpa = String(senhaBanco).trim();

    if (senhaInputLimpa !== senhaBancoLimpa) {
        console.log("🚫 Senhas não batem!");
        return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
    }

    // 4. Verificação de Ativo
    if (user.ativo === false) {
        console.log("🚫 Usuário inativo.");
        return NextResponse.json({ error: "Seu cadastro aguarda aprovação do Administrador." }, { status: 403 });
    }

    console.log("✅ Login Sucesso!");

    // 5. Gera Token
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
    console.error("🔥 Erro Fatal Login:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}