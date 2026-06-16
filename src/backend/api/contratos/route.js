import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { payloadFromBody, validateFornecedorLists } from './helpers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const addMonths = (date, months) => new Date(date.getFullYear(), date.getMonth() + months, 1);
const toCompetencia = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

function proximaCompetencia(contrato, ultimoLancamento) {
  if (contrato.status !== 'Ativo' || contrato.tipo_contrato === 'Avulso') return null;

  const inicio = contrato.data_inicio ? new Date(`${contrato.data_inicio}T12:00:00`) : new Date();
  const base = ultimoLancamento?.competencia
    ? addMonths(new Date(`${ultimoLancamento.competencia}-01T12:00:00`), 1)
    : new Date(inicio.getFullYear(), inicio.getMonth(), 1);

  const hoje = new Date();
  const mesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const proxima = base < mesAtual && !ultimoLancamento ? mesAtual : base;

  return toCompetencia(proxima);
}

export async function GET() {
  const { data: contratos, error } = await supabase
    .from('contratos_mensais')
    .select(`
      *,
      filial:filiais(id, codigo, nome_fantasia),
      fornecedor:fornecedores(id, nome_empresa),
      lancamentos(id, competencia, valor, valor_previsto, data_vencimento, numero_nota, status_pagamento)
    `)
    .order('status', { ascending: true })
    .order('id', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const resposta = (contratos || []).map((contrato) => {
    const lancamentos = [...(contrato.lancamentos || [])].sort((a, b) => String(b.competencia || '').localeCompare(String(a.competencia || '')));
    const ultimo = lancamentos[0] || null;

    return {
      ...contrato,
      ultimo_lancamento: ultimo,
      proxima_competencia: proximaCompetencia(contrato, ultimo),
      lancamentos: undefined,
    };
  });

  return NextResponse.json(resposta);
}

export async function POST(request) {
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
    .insert([payload])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
