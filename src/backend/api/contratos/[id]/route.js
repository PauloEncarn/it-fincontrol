import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { payloadFromBody, validateFornecedorLists } from '../helpers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function PUT(request, context) {
  const params = await context.params;
  const id = params.id;
  const body = await request.json();
  const payload = payloadFromBody(body);

  if (!payload.fornecedor_id || !payload.data_inicio) {
    return NextResponse.json({ error: 'Fornecedor e data de início são obrigatórios.' }, { status: 400 });
  }

  const validationError = await validateFornecedorLists(supabase, payload);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('contratos_mensais')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request, context) {
  const params = await context.params;
  const id = params.id;

  const { error } = await supabase
    .from('contratos_mensais')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
