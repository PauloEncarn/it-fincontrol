export async function POST(request) {
  try {
    // 1. Pegar o Token do cabeçalho
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1]; // Remove o "Bearer "

    if (!token) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // 2. Perguntar ao Supabase quem é esse usuário
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
        return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Tenta pegar o nome completo dos metadados, ou usa o email/username
    const nomeResponsavel = user.user_metadata.nome_completo || user.user_metadata.username || user.email;

    const body = await request.json();
    
    const payload = {
      ...body,
      id: undefined,
      // AQUI ESTÁ A MÁGICA 👇
      responsavel: nomeResponsavel, // O Backend força o nome de quem está logado
      
      // O resto continua igual...
      filial_id: body.filial_id ? parseInt(body.filial_id) : null,
      fornecedor_id: body.fornecedor_id ? parseInt(body.fornecedor_id) : null,
      valor: body.valor ? parseFloat(body.valor) : 0,
      data_vencimento: body.data_vencimento || null,
    };

    const { data, error } = await supabase
      .from('solicitacoes_compra')
      .insert([payload])
      .select();

    if (error) throw error;

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error("Erro ao criar solicitação:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}