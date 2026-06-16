import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getActorFromRequest, registrarEventoLancamento } from '@/backend/utils/audit';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const pad = (value) => String(value).padStart(2, '0');
const competenciaAtual = () => {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${pad(hoje.getMonth() + 1)}`;
};

const vencimentoParaCompetencia = (competencia, dia) => {
  const [ano, mes] = competencia.split('-').map(Number);
  const ultimoDia = new Date(ano, mes, 0).getDate();
  return `${ano}-${pad(mes)}-${pad(Math.min(Number(dia) || 1, ultimoDia))}`;
};

const statusInicial = 'Pendente Fatura';

export async function GET(request, context) {
  const params = await context.params;
  const id = params.id;

  const { data, error } = await supabase
    .from('lancamentos')
    .select(`
      *,
      filial:filiais(*),
      fornecedor:fornecedores(*)
    `)
    .eq('contrato_id', id)
    .order('competencia', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(request, context) {
  const ator = await getActorFromRequest(request);
  const params = await context.params;
  const id = params.id;
  const body = await request.json().catch(() => ({}));
  const competencia = body.competencia || competenciaAtual();

  const { data: contrato, error: errContrato } = await supabase
    .from('contratos_mensais')
    .select('*')
    .eq('id', id)
    .single();

  if (errContrato) return NextResponse.json({ error: errContrato.message }, { status: 500 });
  if (!contrato || contrato.status !== 'Ativo') {
    return NextResponse.json({ error: 'Contrato precisa estar ativo para gerar competência.' }, { status: 400 });
  }

  if (contrato.tipo_contrato === 'Avulso') {
    return NextResponse.json({ error: 'Contrato avulso não gera competência recorrente.' }, { status: 400 });
  }

  if (!contrato.filial_id) {
    return NextResponse.json({ error: 'Informe a filial do contrato antes de gerar nota.' }, { status: 400 });
  }

  const payload = {
    contrato_id: contrato.id,
    competencia,
    filial_id: contrato.filial_id,
    fornecedor_id: contrato.fornecedor_id,
    cnpj_usado: contrato.cnpj_usado,
    contrato_usado: contrato.contrato_usado,
    centro_custo_usado: contrato.centro_custo_usado,
    descricao_servico: contrato.descricao_servico,
    servico_protheus: contrato.produto_protheus || contrato.servico_protheus,
    valor_previsto: contrato.valor_base_previsto,
    valor: contrato.valor_base_previsto,
    data_vencimento: vencimentoParaCompetencia(competencia, contrato.dia_vencimento),
    etapa: 'pendente',
    status_pagamento: statusInicial,
    repetir_por: 1,
    observacao: [contrato.subcontrato_nome, contrato.detalhe].filter(Boolean).join(' | ') || null,
  };

  const { data: existente, error: errExistente } = await supabase
    .from('lancamentos')
    .select('*')
    .eq('contrato_id', contrato.id)
    .eq('competencia', competencia)
    .maybeSingle();

  if (errExistente) return NextResponse.json({ error: errExistente.message }, { status: 500 });
  if (existente) return NextResponse.json(existente);

  const { data, error } = await supabase
    .from('lancamentos')
    .insert([payload])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await registrarEventoLancamento(supabase, {
    lancamentoId: data?.id,
    tipo: 'geracao_recorrente',
    titulo: 'Nota recorrente gerada manualmente',
    descricao: 'Competencia criada a partir do cadastro do contrato recorrente.',
    ator,
    depois: data || null,
    metadata: {
      contrato_id: contrato.id,
      competencia,
    },
  });
  return NextResponse.json(data || { success: true });
}
