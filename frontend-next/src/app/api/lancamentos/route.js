import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const busca = searchParams.get('busca');

  let query = supabase
    .from('lancamentos')
    .select(`*, fornecedor:fornecedores(nome_empresa), filial:filiais(nome_fantasia)`)
    .order('data_vencimento', { ascending: true });

  if (busca) query = query.ilike('numero_nota', `%${busca}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// AQUI ESTÁ A FUNÇÃO QUE O ERRO 405 DIZ QUE NÃO EXISTE
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Preparação dos dados
    const payload = {
      numero_nota: body.numero_nota,
      data_emissao: body.data_emissao || null,
      data_vencimento: body.data_vencimento,
      valor: parseFloat(body.valor),
      observacoes: body.observacoes || null,
      link_boleto: body.link_boleto || null,
      status_pagamento: body.status_pagamento || 'Pendente',
      data_envio: body.data_envio || null,
      fornecedor_id: parseInt(body.fornecedor_id),
      filial_id: parseInt(body.filial_id)
    };

    // Lógica de Repetição
    const repetir = parseInt(body.repetir_por) || 1;
    
    if (repetir > 1) {
        const lancamentos = [];
        let dataBase = new Date(payload.data_vencimento);
        
        for (let i = 0; i < repetir; i++) {
            const novaNota = { ...payload };
            if (i > 0) {
                // Avança os meses corretamente
                const novaData = new Date(dataBase);
                novaData.setMonth(dataBase.getMonth() + i);
                novaNota.data_vencimento = novaData.toISOString().split('T')[0];
                novaNota.numero_nota = `${payload.numero_nota}-${i+1}/${repetir}`;
            }
            lancamentos.push(novaNota);
        }
        
        const { data, error } = await supabase.from('lancamentos').insert(lancamentos).select();
        if (error) throw error;
        return NextResponse.json(data[0]); 
    } else {
        const { data, error } = await supabase.from('lancamentos').insert([payload]).select().single();
        if (error) throw error;
        return NextResponse.json(data);
    }

  } catch (error) {
    console.error("Erro POST Lancamento:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}