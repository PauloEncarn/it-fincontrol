import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';

// GET: Listar usuários
export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const { data, error } = await supabase.from('usuarios').select('id, username, nome_completo, setor, cargo');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST: Criar Usuário (COM LOGS DE DEBUG)
export async function POST(request) {
  console.log("📥 [Cadastro] Iniciando criação de usuário...");
  
  try {
    // 1. Receber dados
    const body = await request.json();
    console.log("📦 [Cadastro] Dados recebidos:", { ...body, password: '***' }); // Esconde senha no log

    const { username, password, nome_completo, cpf, setor, cargo } = body;

    // Validação básica
    if (!username || !password) {
      console.error("❌ [Cadastro] Erro: Username ou senha faltando.");
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // 2. Criptografar Senha
    console.log("🔐 [Cadastro] Gerando hash da senha...");
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("✅ [Cadastro] Hash gerado com sucesso.");

    // 3. Conectar ao Banco
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 4. Inserir no Banco
    console.log("floppy_disk [Cadastro] Salvando no Supabase...");
    const { data, error } = await supabase
      .from('usuarios')
      .insert([{ 
        username, 
        password: hashedPassword, // Certifique-se que a coluna no banco chama 'password'
        nome_completo, 
        cpf, 
        setor, 
        cargo 
      }])
      .select();

    if (error) {
      console.error("❌ [Cadastro] Erro do Supabase:", error);
      return NextResponse.json({ error: `Erro no Banco: ${error.message}` }, { status: 500 });
    }

    console.log("🚀 [Cadastro] Sucesso! Usuário criado.");
    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("🔥 [Cadastro] ERRO FATAL:", err);
    // Retorna o erro exato para o frontend para você ver na tela
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}