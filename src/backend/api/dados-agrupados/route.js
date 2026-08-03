import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calcularBoletoResumoPorGrupo } from './helpers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mes = searchParams.get('mes');
  const ano = searchParams.get('ano');
  const filial_id = searchParams.get('filial_id');

  // Calcular primeiro e último dia do mês
  const startDate = new Date(ano, mes - 1, 1).toISOString().split('T')[0];
  const endDate = new Date(ano, mes, 0).toISOString().split('T')[0]; // dia 0 do prox mês = ultimo desse

  // 1. Buscar Fornecedores
  const { data: fornecedores, error: errForn } = await supabase
    .from('fornecedores')
    .select('*')
    .order('nome_empresa');

  if (errForn) return NextResponse.json({ error: errForn.message }, { status: 500 });

  // 2. Buscar Lançamentos do Mês (Filtrados)
  let query = supabase
    .from('lancamentos')
    .select(`
      *,
      filial:filiais(*),
      fornecedor:fornecedores(*)
    `)
    .gte('data_vencimento', startDate)
    .lte('data_vencimento', endDate);

  if (filial_id) {
    query = query.eq('filial_id', filial_id);
  }

  const { data: lancamentos, error: errLanc } = await query;

  if (errLanc) return NextResponse.json({ error: errLanc.message }, { status: 500 });

  const gruposBoleto = [
    ...new Set((lancamentos || [])
      .map((item) => String(item.boleto_grupo || '').trim())
      .filter(Boolean))
  ];
  let boletoResumoPorGrupo = {};

  if (gruposBoleto.length > 0) {
    const { data: notasBoleto, error: errBoleto } = await supabase
      .from('lancamentos')
      .select('id, numero_nota, valor, boleto_grupo, valor_boleto')
      .in('boleto_grupo', gruposBoleto);

    if (errBoleto) return NextResponse.json({ error: errBoleto.message }, { status: 500 });

    boletoResumoPorGrupo = calcularBoletoResumoPorGrupo(notasBoleto);
  }

  const lancamentosComResumo = (lancamentos || []).map((lancamento) => ({
    ...lancamento,
    boleto_resumo: lancamento.boleto_grupo ? boletoResumoPorGrupo[String(lancamento.boleto_grupo).trim()] || null : null,
  }));

  // 3. Montar a estrutura que o Frontend espera (Agrupar via Javascript)
  // O Frontend espera: Array de Fornecedores, cada um com uma lista 'lancamentos'
  
  const resposta = fornecedores.map(forn => {
    // Pega apenas os lançamentos deste fornecedor
    const notasDoFornecedor = lancamentosComResumo.filter(l => l.fornecedor_id === forn.id);
    
    // Se tiver notas, anexa. Se não, retorna null (será filtrado depois)
    if (notasDoFornecedor.length > 0) {
        return {
            ...forn,
            lancamentos: notasDoFornecedor
        };
    }
    return null;
  }).filter(item => item !== null); // Remove fornecedores sem notas no mês

  return NextResponse.json(resposta);
}
