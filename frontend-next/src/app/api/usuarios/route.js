import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { hash } from 'bcryptjs'; // <--- Importar o hash

// Usa a chave Service Role para poder criar usuário mesmo sem estar logado (cadastro público)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// --- POST: CRIAR USUÁRIO ---
export async function POST(request) {
  try {
    const body = await request.json();

    if (!body.username || !body.password) {
        return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    // 1. Criptografa a senha antes de salvar
    const senhaCriptografada = await hash(body.password, 10); // 10 é o "custo" (salt)

    const payload = {
        username: body.username,
        password_hash: senhaCriptografada, // Salva na coluna correta
        password: senhaCriptografada,      // Salva na outra tbm por garantia (já que seu banco tem as duas)
        nome_completo: body.nome_completo,
        setor: body.setor,
        cargo: body.cargo,
        ativo: false // Padrão é inativo, esperando aprovação
    };

    const { data, error } = await supabase
      .from('usuarios')
      .insert([payload])
      .select();

    if (error) {
        if (error.code === '23505') return NextResponse.json({ error: "Usuário já existe." }, { status: 409 });
        throw error;
    }

    return NextResponse.json(data[0]);

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- GET: LISTAR USUÁRIOS (Para a tela de Admin) ---
export async function GET() {
    // ... sua logica de GET existente ...
    // Se não tiver o arquivo GET, me avise que eu mando!
    const { data, error } = await supabase.from('usuarios').select('*').order('nome_completo');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

// --- PUT: ATIVAR/DESATIVAR (Para o Admin aprovar) ---
export async function PUT(request) {
    try {
        // Pega o ID da URL (gambiarra do next 13 se não usar pasta [id])
        // O ideal é esse arquivo ser /api/usuarios/[id]/route.js, 
        // mas se você estiver enviando o ID no corpo ou a estrutura for pasta raiz:
        
        // Vamos assumir que o Admin manda o ID e o status no corpo para simplificar, 
        // OU que você tem o arquivo `src/app/api/usuarios/[id]/route.js`.
        
        // SE ESTE ARQUIVO FOR O `src/app/api/usuarios/route.js`, ele lida com POST e GET.
        // O PUT geralmente fica em `src/app/api/usuarios/[id]/route.js`.
        
        return NextResponse.json({ message: "Use a rota com ID para atualizar" });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}