import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const dynamic = 'force-dynamic';

const pad = (value) => String(value).padStart(2, '0');
const toDateKey = (date) => `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
const toCompetencia = (date) => `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;
const addMonths = (date, months) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1, 12));
const diffDays = (from, to) => Math.round((to.getTime() - from.getTime()) / 86400000);

function todayInSaoPaulo() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return new Date(Date.UTC(Number(byType.year), Number(byType.month) - 1, Number(byType.day), 12));
}

function dueDateForMonth(baseMonth, day) {
  const year = baseMonth.getUTCFullYear();
  const month = baseMonth.getUTCMonth();
  const lastDay = new Date(Date.UTC(year, month + 1, 0, 12)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(Number(day) || 1, lastDay), 12));
}

function monthStart(dateString) {
  if (!dateString) return null;
  const [year, month] = String(dateString).split('-').map(Number);
  if (!year || !month) return null;
  return new Date(Date.UTC(year, month - 1, 1, 12));
}

function contractAllowsCompetencia(contrato, competenciaDate) {
  const inicio = monthStart(contrato.data_inicio);
  if (inicio && competenciaDate < inicio) return false;

  return true;
}

function authorized(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;

  const auth = request.headers.get('authorization') || '';
  const urlSecret = new URL(request.url).searchParams.get('secret');

  return auth === `Bearer ${secret}` || urlSecret === secret;
}

async function createLancamentoForContrato(contrato, competencia, vencimento) {
  const { data: existente, error: errExistente } = await supabase
    .from('lancamentos')
    .select('id')
    .eq('contrato_id', contrato.id)
    .eq('competencia', competencia)
    .maybeSingle();

  if (errExistente) throw errExistente;
  if (existente) return { status: 'exists', id: existente.id };

  const payload = {
    contrato_id: contrato.id,
    competencia,
    filial_id: contrato.filial_id,
    fornecedor_id: contrato.fornecedor_id,
    cnpj_usado: contrato.cnpj_usado,
    contrato_usado: contrato.contrato_usado,
    centro_custo_usado: contrato.centro_custo_usado,
    descricao_servico: contrato.descricao_servico,
    servico_protheus: contrato.servico_protheus,
    valor_previsto: contrato.valor_base_previsto,
    valor: contrato.valor_base_previsto,
    data_vencimento: vencimento,
    status_pagamento: 'Aguardando Fatura',
    repetir_por: 1,
    observacao: contrato.observacao ? `Gerado automaticamente. ${contrato.observacao}` : 'Gerado automaticamente por contrato recorrente.',
  };

  const { data, error } = await supabase
    .from('lancamentos')
    .insert([payload])
    .select('id')
    .single();

  if (error) throw error;
  return { status: 'created', id: data.id };
}

export async function GET(request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'NÃ£o autorizado.' }, { status: 401 });
  }

  const hoje = todayInSaoPaulo();
  const mesesCandidatos = [new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), 1, 12)), addMonths(hoje, 1)];

  const { data: contratos, error } = await supabase
    .from('contratos_mensais')
    .select('*')
    .eq('status', 'Ativo');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const resumo = {
    ok: true,
    checked_at: new Date().toISOString(),
    hoje: toDateKey(hoje),
    janela_dias: 10,
    contratos_ativos: contratos?.length || 0,
    criados: 0,
    existentes: 0,
    ignorados: 0,
    erros: [],
  };

  for (const contrato of contratos || []) {
    for (const mes of mesesCandidatos) {
      if (!contractAllowsCompetencia(contrato, mes)) {
        resumo.ignorados += 1;
        continue;
      }

      const vencimento = dueDateForMonth(mes, contrato.dia_vencimento);
      const diasAteVencimento = diffDays(hoje, vencimento);

      if (diasAteVencimento < 0 || diasAteVencimento > 10) {
        resumo.ignorados += 1;
        continue;
      }

      const competencia = toCompetencia(mes);

      try {
        const result = await createLancamentoForContrato(contrato, competencia, toDateKey(vencimento));
        if (result.status === 'created') resumo.criados += 1;
        if (result.status === 'exists') resumo.existentes += 1;
      } catch (err) {
        resumo.erros.push({
          contrato_id: contrato.id,
          competencia,
          error: err.message,
        });
      }
    }
  }

  return NextResponse.json(resumo, {
    status: resumo.erros.length ? 207 : 200,
    headers: { 'Cache-Control': 'no-store' },
  });
}
