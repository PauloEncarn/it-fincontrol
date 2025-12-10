import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(request, props) {
  try {
    // 1. CORREÇÃO: Await no params
    const params = await props.params;
    const id = parseInt(params.id);
    
    const { status } = await request.json();
    console.log(`🔄 Atualizando Status ID ${id} para: ${status}`);

    const atualizado = await prisma.lancamentos.update({
      where: { id },
      data: { status_pagamento: status }
    });

    return NextResponse.json(atualizado);
  } catch (error) {
    console.error("❌ ERRO AO ATUALIZAR STATUS:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}