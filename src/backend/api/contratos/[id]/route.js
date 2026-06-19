import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { payloadFromBody, validateContratoUnico, validateFornecedorLists } from '../helpers';

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

  const { data: existingContrato, error: existingError } = await supabase
    .from('contratos_mensais')
    .select('cnpj_usado, contrato_usado, centro_custo_usado, descricao_servico, produto_protheus, valor_base_previsto')
    .eq('id', id)
    .single();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  const validationError = await validateFornecedorLists(supabase, payload, existingContrato);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const uniqueError = await validateContratoUnico(supabase, payload, id);
  if (uniqueError) {
    return NextResponse.json({ error: uniqueError }, { status: 400 });
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
  try {
    const params = await context.params;
    const id = params.id;

    const { data: lancamentosVinculados, error: errorCheck } = await supabase
      .from('lancamentos')
      .select('id')
      .eq('contrato_id', id)
      .limit(1);

    if (errorCheck) throw errorCheck;

    if (lancamentosVinculados?.length) {
      return NextResponse.json(
        { error: 'Não é possível excluir: Este contrato possui lançamentos vinculados.' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('contratos_mensais')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === '23503') {
        return NextResponse.json(
          { error: 'Não é possível excluir: Este contrato está vinculado a registros relacionados.' },
          { status: 400 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro Delete Contrato:', error);
    return NextResponse.json({ error: error.message || 'Erro ao excluir contrato.' }, { status: 500 });
  }
}
