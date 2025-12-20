import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SignJWT } from 'jose'; // Biblioteca padrão do Next.js para JWT

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const body = await request.formData(); // Ou request.json() dependendo do seu frontend
    const username = body.get('username');
    const password = body.get('password');

    // 1. Busca o usuário no banco
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('username', username)
      .single(); // Traz apenas 1 resultado

    // Se der erro ou não achar usuário
    if (error || !data) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 401 });
    }

    // 2. Define a variável 'user' (AQUI ESTAVA O ERRO ANTES)
    const user = data; 

    // 3. Verifica a senha (Comparação simples)
    // Nota: Em produção, o ideal é usar bcrypt para hash, mas vamos manter simples por enquanto
    if (user.senha !== password && user.password !== password) {
        return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
    }

    // 4. VERIFICAÇÃO DE ATIVO (NOVA) ✅
    // Se ativo for nulo, consideramos true (para usuários antigos), se for false, bloqueia.
    if (user.ativo === false) {
        return NextResponse.json({ 
            error: "Seu cadastro aguarda aprovação do Administrador." 
        }, { status: 403 });
    }

    // 5. Gera o Token JWT
    const secret = new TextEncoder().encode(process.env.SUPABASE_SERVICE_ROLE_KEY || 'segredo-padrao-123');
    const token = await new SignJWT({ 
        sub: user.id, 
        username: user.username, 
        nome: user.nome_completo,
        nivel: user.cargo // ou nivel_acesso
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('8h') // Token dura 8 horas
      .sign(secret);

    return NextResponse.json({ access_token: token });

  } catch (error) {
    console.error("Erro Login:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}