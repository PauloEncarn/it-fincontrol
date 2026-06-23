import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { numberOrNull, textOrNull } from '../helpers';

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

export const regraPayloadFromBody = (body) => ({
  contrato_id: numberOrNull(body.contrato_id),
  contrato_importacao: textOrNull(body.contrato_importacao),
  filial_codigo: textOrNull(body.filial_codigo),
  fornecedor_importacao: textOrNull(body.fornecedor_importacao),
  identificador_item_importacao: textOrNull(body.identificador_item_importacao),
  servico_importacao: textOrNull(body.servico_importacao),
  servico_protheus_importacao: textOrNull(body.servico_protheus_importacao),
  centro_custo_importacao: textOrNull(body.centro_custo_importacao),
  dia_vencimento: textOrNull(body.dia_vencimento),
  valor_referencia: numberOrNull(body.valor_referencia),
  tolerancia_valor_percentual: numberOrNull(body.tolerancia_valor_percentual) ?? 5,
  prioridade: numberOrNull(body.prioridade) ?? 100,
  ativo: body.ativo === false || body.ativo === 'false' ? false : true,
  observacao: textOrNull(body.observacao),
  updated_at: new Date().toISOString(),
});

export const validarRegra = (payload) => {
  if (!payload.contrato_id) return 'Selecione o contrato correto.';
  if (!payload.contrato_importacao) return 'Informe o numero do contrato vindo da importacao.';
  if (!payload.filial_codigo) return 'Informe o codigo da filial vindo da importacao.';
  return null;
};

export async function GET() {
  const { data, error } = await supabase
    .from('contrato_vinculo_regras')
    .select(regraSelect)
    .order('ativo', { ascending: false })
    .order('prioridade', { ascending: false })
    .order('updated_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(request) {
  const body = await request.json();
  const payload = regraPayloadFromBody(body);
  const validationError = validarRegra(payload);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('contrato_vinculo_regras')
    .insert([payload])
    .select(regraSelect)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
