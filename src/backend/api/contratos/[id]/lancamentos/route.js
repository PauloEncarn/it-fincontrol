import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getActorFromRequest } from '@/backend/utils/audit';
import { competenciaAtualSaoPaulo, createLancamentoForContrato } from '@/backend/api/contratos/geracao-recorrente';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
  const competencia = body.competencia || competenciaAtualSaoPaulo();

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

  try {
    const result = await createLancamentoForContrato(supabase, contrato, competencia, {
      ator,
      origem: 'manual',
      titulo: 'Nota recorrente gerada manualmente',
      descricao: 'Competencia criada a partir do cadastro do contrato recorrente.',
    });

    return NextResponse.json(result.lancamento || { success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
