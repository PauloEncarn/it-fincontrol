import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ⚠️ COLOQUE SUAS CHAVES DO SUPABASE AQUI ⚠️
const supabaseUrl = 'https://xadqglbzkqqohyzefqdo.supabase.co';
const supabaseKey = 'sb_secret_IBkn6RyHjrvH4IRsbEWXrQ_AU6KC08R'; 


const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request) {
  const formData = await request.formData();
  const file = formData.get('file');
  const fornecedor = formData.get('fornecedor') || 'Outros';
  const nota = formData.get('nota') || 'SN';
  const vencimento = formData.get('vencimento') || 'SD';

  if (!file) return NextResponse.json({ error: 'Arquivo obrigatório' }, { status: 400 });

  const sanitize = (str) => str.replace(/[^a-zA-Z0-9]/g, '_');
  const path = `${sanitize(fornecedor)}/${sanitize(nota)}_${sanitize(vencimento)}_${sanitize(file.name)}`;

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const { error } = await supabase.storage.from('notas-e-boletos').upload(path, buffer, {
      contentType: file.type,
      upsert: true
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = supabase.storage.from('notas-e-boletos').getPublicUrl(path);
  return NextResponse.json({ path: data.publicUrl });
}