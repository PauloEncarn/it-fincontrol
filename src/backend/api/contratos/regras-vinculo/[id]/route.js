import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { regraPayloadFromBody, validarRegra } from '../route';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const regraSelect = `
  *,
  contrato:contratos_mensais(
    id,
    contrato_usado,
    subcontrato_nome,
    descricao_servico,
    produto_protheus,
    centro_custo_usado,
    fornecedor:fornecedores(id, nome_empresa),
    filial:filiais(id, codigo, nome_fantasia)
  )
`;

export async function PUT(request, context) {
  const params = await context.params;
  const body = await request.json();
  const payload = regraPayloadFromBody(body);
  const validationError = validarRegra(payload);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('contrato_vinculo_regras')
    .update(payload)
    .eq('id', params.id)
    .select(regraSelect)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request, context) {
  const params = await context.params;
  const { error } = await supabase
    .from('contrato_vinculo_regras')
    .delete()
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
