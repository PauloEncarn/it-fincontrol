import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const toList = (value) => {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (value === null || value === undefined) return [];
  return String(value)
    .split(/[;|\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const payloadFromBody = (body) => ({
  nome_empresa: String(body.nome_empresa || '').trim(),
  padrao_descricao_servico: String(body.padrao_descricao_servico || '').trim() || null,
  padrao_servico_protheus: String(body.padrao_servico_protheus || '').trim() || null,
  lista_cnpjs: toList(body.lista_cnpjs),
  lista_contratos: toList(body.lista_contratos),
  lista_centro_custos: toList(body.lista_centro_custos),
  lista_servicos: toList(body.lista_servicos),
  lista_produtos_protheus: toList(body.lista_produtos_protheus),
  lista_valores: toList(body.lista_valores),
});

export async function GET() {
  const { data, error } = await supabase
    .from('fornecedores')
    .select('*')
    .order('nome_empresa', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request) {
  const data = await request.json();
  const { error } = await supabase.from('fornecedores').insert([payloadFromBody(data)]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
// Adicione PUT/DELETE se necessário seguindo o padrão acima
