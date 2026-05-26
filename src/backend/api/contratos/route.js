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

const addMonths = (date, months) => new Date(date.getFullYear(), date.getMonth() + months, 1);
const toCompetencia = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

function proximaCompetencia(contrato, ultimoLancamento) {
  if (contrato.status !== 'Ativo') return null;

  const inicio = contrato.data_inicio ? new Date(`${contrato.data_inicio}T12:00:00`) : new Date();
  const base = ultimoLancamento?.competencia
    ? addMonths(new Date(`${ultimoLancamento.competencia}-01T12:00:00`), 1)
    : new Date(inicio.getFullYear(), inicio.getMonth(), 1);

  const hoje = new Date();
  const mesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const proxima = base < mesAtual && !ultimoLancamento ? mesAtual : base;

  if (contrato.data_fim) {
    const fim = new Date(`${contrato.data_fim}T12:00:00`);
    const limite = new Date(fim.getFullYear(), fim.getMonth(), 1);
    if (proxima > limite) return null;
  }

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

  if (!payload.fornecedor_id || !payload.filial_id || !payload.data_inicio) {
    return NextResponse.json({ error: 'Fornecedor, filial e data de início são obrigatórios.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('contratos_mensais')
    .insert([payload])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
