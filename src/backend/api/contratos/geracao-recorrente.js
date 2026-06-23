import { registrarEventoLancamento } from '@/backend/utils/audit';

const pad = (value) => String(value).padStart(2, '0');

export const toDateKey = (date) => `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
export const toCompetencia = (date) => `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;
export const diffDays = (from, to) => Math.round((to.getTime() - from.getTime()) / 86400000);

export function todayInSaoPaulo() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return new Date(Date.UTC(Number(byType.year), Number(byType.month) - 1, Number(byType.day), 12));
}

export function competenciaAtualSaoPaulo() {
  return toCompetencia(todayInSaoPaulo());
}

export function dueDateForCompetencia(competencia, day) {
  const [year, month] = String(competencia || '').split('-').map(Number);
  if (!year || !month) return null;

  const lastDay = new Date(Date.UTC(year, month, 0, 12)).getUTCDate();
  return new Date(Date.UTC(year, month - 1, Math.min(Number(day) || 1, lastDay), 12));
}

function monthStart(dateString) {
  if (!dateString) return null;
  const [year, month] = String(dateString).split('-').map(Number);
  if (!year || !month) return null;
  return new Date(Date.UTC(year, month - 1, 1, 12));
}

export function contractAllowsCompetencia(contrato, competencia) {
  const competenciaDate = monthStart(competencia);
  if (!competenciaDate) return false;

  const inicio = monthStart(contrato.data_inicio);
  if (inicio && competenciaDate < inicio) return false;

  return true;
}

export async function valorInicialParaContrato(supabase, contrato) {
  if (contrato.valor_fixo !== false) {
    return contrato.valor_base_previsto ?? null;
  }

  const { data, error } = await supabase
    .from('lancamentos')
    .select('valor')
    .eq('contrato_id', contrato.id)
    .not('valor', 'is', null)
    .order('competencia', { ascending: false })
    .order('id', { ascending: false })
    .limit(1);

  if (error) throw error;
  return data?.[0]?.valor ?? null;
}

export async function createLancamentoForContrato(supabase, contrato, competencia, options = {}) {
  const {
    ator = null,
    origem = 'sistema',
    titulo = 'Nota recorrente gerada',
    descricao = 'Competencia criada a partir do cadastro do contrato recorrente.',
  } = options;

  const { data: existentes, error: errExistente } = await supabase
    .from('lancamentos')
    .select('*')
    .eq('contrato_id', contrato.id)
    .eq('competencia', competencia)
    .order('id', { ascending: false })
    .limit(1);

  if (errExistente) throw errExistente;
  const existente = existentes?.[0];
  if (existente) return { status: 'exists', lancamento: existente };

  const vencimento = dueDateForCompetencia(competencia, contrato.dia_vencimento);
  const valorInicial = await valorInicialParaContrato(supabase, contrato);

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
    valor_previsto: valorInicial,
    valor: valorInicial,
    data_vencimento: vencimento ? toDateKey(vencimento) : null,
    etapa: 'pendente',
    status_pagamento: 'Pendente Fatura',
    repetir_por: 1,
    observacao: null,
  };

  const { data, error } = await supabase
    .from('lancamentos')
    .insert([payload])
    .select('*')
    .single();

  if (error) throw error;

  await registrarEventoLancamento(supabase, {
    lancamentoId: data?.id,
    tipo: 'geracao_recorrente',
    titulo,
    descricao,
    ator,
    origem,
    depois: data || null,
    metadata: {
      contrato_id: contrato.id,
      competencia,
      vencimento: payload.data_vencimento,
    },
  });

  return { status: 'created', lancamento: data };
}

export async function gerarNotasPendentes(supabase, options = {}) {
  const {
    competencia = competenciaAtualSaoPaulo(),
    janelaDias = null,
    aplicarJanela = false,
    hoje = todayInSaoPaulo(),
    ator = null,
    origem = 'sistema',
  } = options;

  const { data: contratos, error } = await supabase
    .from('contratos_mensais')
    .select('*')
    .eq('status', 'Ativo')
    .eq('tipo_contrato', 'Recorrente');

  if (error) throw error;

  const resumo = {
    ok: true,
    checked_at: new Date().toISOString(),
    competencia,
    hoje: toDateKey(hoje),
    janela_dias: janelaDias,
    contratos_ativos: contratos?.length || 0,
    criados: 0,
    existentes: 0,
    ignorados: 0,
    erros: [],
  };

  for (const contrato of contratos || []) {
    if (!contrato.filial_id || !contractAllowsCompetencia(contrato, competencia)) {
      resumo.ignorados += 1;
      continue;
    }

    const vencimento = dueDateForCompetencia(competencia, contrato.dia_vencimento);
    if (aplicarJanela && janelaDias !== null) {
      const diasAteVencimento = vencimento ? diffDays(hoje, vencimento) : null;
      if (diasAteVencimento === null || diasAteVencimento < 0 || diasAteVencimento > janelaDias) {
        resumo.ignorados += 1;
        continue;
      }
    }

    try {
      const result = await createLancamentoForContrato(supabase, contrato, competencia, {
        ator,
        origem,
        titulo: origem === 'job' ? 'Nota recorrente gerada pelo job' : 'Nota recorrente pendente gerada',
        descricao: origem === 'job'
          ? 'Lancamento criado automaticamente pelo job de contratos recorrentes.'
          : 'Lancamento pendente criado em lote a partir dos contratos recorrentes.',
      });

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

  return resumo;
}
