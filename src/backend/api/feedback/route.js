import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return new NextResponse(
        `<html><body style="font-family:sans-serif;text-align:center;padding:50px;"><h1>❌ Link inválido</h1></body></html>`, 
        { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { id, action } = decoded;

    let novoStatus = '';
    let corTitulo = '';
    let icone = '';
    let mensagemTitulo = '';
    let mensagemCorpo = '';

    // --- NOVA LÓGICA DE STATUS ---
    let novaEtapa = null;

    if (action === 'autorizar') {
        novoStatus = 'Concluída'; // <--- Mudado para Concluída
        novaEtapa = 'concluida';
        corTitulo = '#10B981'; // Verde
        icone = '✅';
        mensagemTitulo = 'Pagamento Confirmado!';
        mensagemCorpo = 'A nota foi baixada e o status atualizado para <strong>Concluída</strong>.';
    } else if (action === 'sem_saldo') {
        novoStatus = 'Aguardando Pagamento'; // <--- Mudado para Aguardando Pagamento
        novaEtapa = 'contingencia';
        corTitulo = '#F59E0B'; // Amarelo/Laranja (Alerta)
        icone = '💰';
        mensagemTitulo = 'Sem Saldo Informado';
        mensagemCorpo = 'Registramos a falta de saldo. A nota ficará em <strong>Aguardando Pagamento</strong> para tentativa futura.';
    }

    const payload = { status_pagamento: novoStatus };
    if (novaEtapa) payload.etapa = novaEtapa;

    const { error } = await supabase
        .from('lancamentos')
        .update(payload)
        .eq('id', id);

    if (error) throw error;

    const htmlFeedback = `
      <!DOCTYPE html>
      <html>
        <head>
            <title>Ação Registrada</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); max-width: 400px; text-align: center; width: 90%;">
            <div style="font-size: 64px; margin-bottom: 20px;">${icone}</div>
            <h1 style="color: ${corTitulo}; margin: 0 0 15px 0; font-size: 28px;">${mensagemTitulo}</h1>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">${mensagemCorpo}</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 12px; color: #9ca3af;">Sistema IT FinControl - Cicopal</p>
                <button onclick="window.close()" style="background: none; border: none; color: #6b7280; text-decoration: underline; cursor: pointer; font-size: 14px; margin-top: 10px;">Fechar esta janela</button>
            </div>
          </div>
        </body>
      </html>
    `;

    return new NextResponse(htmlFeedback, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });

  } catch (error) {
    console.error("Erro no feedback:", error);
    return new NextResponse(
        `<html><body style="font-family:sans-serif;text-align:center;padding:50px;"><h1>⚠️ Link Expirado ou Inválido</h1></body></html>`, 
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}
