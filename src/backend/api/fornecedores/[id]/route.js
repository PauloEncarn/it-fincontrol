import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const toList = (value) => {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (value === null || value === undefined) return [];
  return String(value)
    .split(/[;|\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const payloadFromBody = (body) => ({
  ...body,
  lista_cnpjs: toList(body.lista_cnpjs),
  lista_contratos: toList(body.lista_contratos),
  lista_centro_custos: toList(body.lista_centro_custos),
  lista_servicos: toList(body.lista_servicos),
  lista_produtos_protheus: toList(body.lista_produtos_protheus),
  lista_valores: toList(body.lista_valores),
});

export async function PUT(request, context) {
  try {
    // Correção para Next.js recente: await params
    const params = await context.params; 
    const id = params.id;
    
    const body = await request.json();
    const { error } = await supabase.from('fornecedores').update(payloadFromBody(body)).eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    const params = await context.params;
    const id = params.id;

    const [{ data: contratosVinculados }, { data: lancamentosVinculados }] = await Promise.all([
      supabase.from('contratos_mensais').select('id').eq('fornecedor_id', id).limit(1),
      supabase.from('lancamentos').select('id').eq('fornecedor_id', id).limit(1),
    ]);

    if (contratosVinculados?.length || lancamentosVinculados?.length) {
      return NextResponse.json(
        {
          error: 'Não é possível excluir: Este fornecedor possui contratos e/ou lançamentos vinculados.',
        },
        { status: 400 }
      );
    }

    const { error } = await supabase.from('fornecedores').delete().eq('id', id);

    if (error) {
      if (error.code === '23503') {
        return NextResponse.json(
          { error: 'Não é possível excluir: Este fornecedor possui registros vinculados.' },
          { status: 400 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro Delete Fornecedor:', error);
    return NextResponse.json({ error: error.message || 'Erro ao excluir' }, { status: 500 });
  }
}
