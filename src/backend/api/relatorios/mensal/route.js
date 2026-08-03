import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calcularBoletoResumoPorGrupo } from '@/backend/api/dados-agrupados/helpers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const toDateOnly = (date) => date.toISOString().split('T')[0];
const competenciaFrom = (ano, mes) => `${ano}-${String(mes).padStart(2, '0')}`;

const normalize = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toLowerCase();

const isConcluida = (nota) => {
  const etapa = normalize(nota?.etapa);
  const status = normalize(nota?.status_pagamento);
  return etapa === 'concluida' || status.includes('concluida') || status.includes('pago') || status.includes('cancelada');
};

const isVencida = (nota, hoje) => {
  if (!nota?.data_vencimento || isConcluida(nota)) return false;
  return new Date(`${nota.data_vencimento}T12:00:00`) < hoje;
};

const diasAteVencimento = (nota, hoje) => {
  if (!nota?.data_vencimento) return null;
  const vencimento = new Date(`${nota.data_vencimento}T12:00:00`);
  return Math.ceil((vencimento.getTime() - hoje.getTime()) / 86400000);
};

const pickNota = (nota) => ({
  id: nota.id,
  fornecedor_id: nota.fornecedor_id,
  filial_id: nota.filial_id,
  contrato_id: nota.contrato_id,
  competencia: nota.competencia,
  numero_nota: nota.numero_nota,
  numero_pedido: nota.numero_pedido,
  numero_medicao: nota.numero_medicao,
  solicitacao_fluig: nota.solicitacao_fluig,
  contrato_usado: nota.contrato_usado,
  descricao_servico: nota.descricao_servico,
  status_pagamento: nota.status_pagamento,
  etapa: nota.etapa,
  valor: nota.valor,
  valor_previsto: nota.valor_previsto,
  data_vencimento: nota.data_vencimento,
  arquivo_nota: nota.arquivo_nota,
  arquivo_boleto: nota.arquivo_boleto,
  boleto_grupo: nota.boleto_grupo,
  valor_boleto: nota.valor_boleto,
  fornecedor: nota.fornecedor,
  filial: nota.filial,
});

const pickContrato = (contrato) => ({
  id: contrato.id,
  fornecedor_id: contrato.fornecedor_id,
  filial_id: contrato.filial_id,
  contrato_usado: contrato.contrato_usado,
  nome_contrato: contrato.nome_contrato,
  subcontrato_nome: contrato.subcontrato_nome,
  descricao_servico: contrato.descricao_servico,
  produto_protheus: contrato.produto_protheus,
  servico_protheus: contrato.servico_protheus,
  centro_custo_usado: contrato.centro_custo_usado,
  valor_fixo: contrato.valor_fixo,
  valor_base_previsto: contrato.valor_base_previsto,
  dia_vencimento: contrato.dia_vencimento,
  status: contrato.status,
  tipo_contrato: contrato.tipo_contrato,
  fornecedor: contrato.fornecedor,
  filial: contrato.filial,
});

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const mes = Number(searchParams.get('mes') || now.getMonth() + 1);
    const ano = Number(searchParams.get('ano') || now.getFullYear());
    const filialId = searchParams.get('filial_id');
    const competencia = competenciaFrom(ano, mes);
    const startDate = toDateOnly(new Date(ano, mes - 1, 1));
    const endDate = toDateOnly(new Date(ano, mes, 0));
    const hoje = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);

    let lancamentosQuery = supabase
      .from('lancamentos')
      .select(`
        *,
        filial:filiais(id, codigo, nome_fantasia),
        fornecedor:fornecedores(id, nome_empresa)
      `)
      .gte('data_vencimento', startDate)
      .lte('data_vencimento', endDate)
      .order('data_vencimento', { ascending: true });

    if (filialId) lancamentosQuery = lancamentosQuery.eq('filial_id', filialId);

    const { data: lancamentos = [], error: lancamentosError } = await lancamentosQuery;
    if (lancamentosError) throw lancamentosError;

    let contratosQuery = supabase
      .from('contratos_mensais')
      .select(`
        id,
        fornecedor_id,
        filial_id,
        tipo_contrato,
        cnpj_usado,
        contrato_usado,
        nome_contrato,
        subcontrato_nome,
        produto_protheus,
        centro_custo_usado,
        descricao_servico,
        servico_protheus,
        valor_fixo,
        valor_base_previsto,
        dia_vencimento,
        status,
        data_inicio,
        data_fim,
        filial:filiais(id, codigo, nome_fantasia),
        fornecedor:fornecedores(id, nome_empresa)
      `)
      .eq('status', 'Ativo')
      .neq('tipo_contrato', 'Avulso')
      .order('contrato_usado', { ascending: true });

    if (filialId) contratosQuery = contratosQuery.eq('filial_id', filialId);

    const { data: contratos = [], error: contratosError } = await contratosQuery;
    if (contratosError) throw contratosError;

    const gruposBoleto = [...new Set((lancamentos || []).map((item) => String(item.boleto_grupo || '').trim()).filter(Boolean))];
    let boletoResumoPorGrupo = {};

    if (gruposBoleto.length > 0) {
      const { data: notasBoleto = [], error: boletoError } = await supabase
        .from('lancamentos')
        .select('id, numero_nota, valor, boleto_grupo, valor_boleto')
        .in('boleto_grupo', gruposBoleto);

      if (boletoError) throw boletoError;
      boletoResumoPorGrupo = calcularBoletoResumoPorGrupo(notasBoleto);
    }

    const notas = (lancamentos || []).map((nota) => ({
      ...nota,
      boleto_resumo: nota.boleto_grupo ? boletoResumoPorGrupo[String(nota.boleto_grupo).trim()] || null : null,
    }));

    const contratosComNota = new Set(
      notas
        .filter((nota) => nota.contrato_id && (nota.competencia === competencia || (nota.data_vencimento >= startDate && nota.data_vencimento <= endDate)))
        .map((nota) => String(nota.contrato_id))
    );

    const contratosSemNotaMes = (contratos || [])
      .filter((contrato) => !contratosComNota.has(String(contrato.id)))
      .map(pickContrato);

    const pendencias = {
      vencidas: notas.filter((nota) => isVencida(nota, hoje)).map(pickNota),
      proximas_7_dias: notas
        .filter((nota) => {
          const dias = diasAteVencimento(nota, hoje);
          return dias !== null && dias >= 0 && dias <= 7 && !isConcluida(nota);
        })
        .map(pickNota),
      sem_nota_fiscal: notas.filter((nota) => !nota.numero_nota && !isConcluida(nota)).map(pickNota),
      sem_boleto: notas.filter((nota) => !nota.arquivo_boleto && !isConcluida(nota)).map(pickNota),
      sem_controle_interno: notas
        .filter((nota) => (!nota.numero_medicao || !nota.numero_pedido || !nota.solicitacao_fluig) && !isConcluida(nota))
        .map(pickNota),
      boleto_divergente: notas
        .filter((nota) => nota.boleto_resumo && nota.boleto_resumo.ok === false)
        .map(pickNota),
      contratos_sem_nota_mes: contratosSemNotaMes,
    };

    const valorTotal = notas.reduce((total, nota) => total + Number(nota.valor || 0), 0);
    const valorPrevisto = notas.reduce((total, nota) => total + Number(nota.valor_previsto || 0), 0);
    const concluidas = notas.filter(isConcluida);
    const abertas = notas.filter((nota) => !isConcluida(nota));

    return NextResponse.json({
      competencia,
      periodo: { inicio: startDate, fim: endDate },
      totalizadores: {
        notas: notas.length,
        abertas: abertas.length,
        concluidas: concluidas.length,
        contratos_sem_nota_mes: contratosSemNotaMes.length,
        boleto_divergente: pendencias.boleto_divergente.length,
        valor_total: valorTotal,
        valor_previsto: valorPrevisto,
        diferenca_previsto: valorTotal - valorPrevisto,
      },
      pendencias,
      fechamento: [
        { id: 'contratos_sem_nota_mes', label: 'Contratos recorrentes com nota do mes', pendencias: contratosSemNotaMes.length },
        { id: 'sem_nota_fiscal', label: 'Notas fiscais informadas', pendencias: pendencias.sem_nota_fiscal.length },
        { id: 'sem_boleto', label: 'Boletos anexados', pendencias: pendencias.sem_boleto.length },
        { id: 'sem_controle_interno', label: 'Medicao, pedido e Fluig preenchidos', pendencias: pendencias.sem_controle_interno.length },
        { id: 'boleto_divergente', label: 'Boletos compartilhados conciliados', pendencias: pendencias.boleto_divergente.length },
        { id: 'vencidas', label: 'Sem notas vencidas em aberto', pendencias: pendencias.vencidas.length },
      ],
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
