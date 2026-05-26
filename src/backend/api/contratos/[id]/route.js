import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const numberOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const textOrNull = (value) => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text || null;
};

const payloadFromBody = (body) => ({
  fornecedor_id: numberOrNull(body.fornecedor_id),
  filial_id: numberOrNull(body.filial_id),
  cnpj_usado: textOrNull(body.cnpj_usado),
  contrato_usado: textOrNull(body.contrato_usado),
  centro_custo_usado: textOrNull(body.centro_custo_usado),
  descricao_servico: textOrNull(body.descricao_servico),
  servico_protheus: textOrNull(body.servico_protheus),
  valor_base_previsto: numberOrNull(body.valor_base_previsto) || 0,
  dia_vencimento: numberOrNull(body.dia_vencimento) || 1,
  tolerancia_percentual: numberOrNull(body.tolerancia_percentual) ?? 5,
  status: textOrNull(body.status) || 'Ativo',
  data_inicio: textOrNull(body.data_inicio),
  data_fim: textOrNull(body.data_fim),
  observacao: textOrNull(body.observacao),
  updated_at: new Date().toISOString(),
});

export async function PUT(request, context) {
  const params = await context.params;
  const id = params.id;
  const body = await request.json();

  const { data, error } = await supabase
    .from('contratos_mensais')
    .update(payloadFromBody(body))
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
