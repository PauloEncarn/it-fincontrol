import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const filialId = searchParams.get('filial_id');
  const mes = searchParams.get('mes');
  const ano = searchParams.get('ano');

  const whereLancamento = {};
  if (filialId) whereLancamento.filial_id = parseInt(filialId);
  
  if (mes && ano) {
    const start = new Date(ano, mes - 1, 1);
    const end = new Date(ano, mes, 0, 23, 59, 59);
    whereLancamento.data_vencimento = { gte: start, lte: end };
  }

  const fornecedores = await prisma.fornecedores.findMany({
    include: {
      lancamentos: {
        where: whereLancamento,
        include: { filial: true }
      }
    }
  });

  const filtrados = fornecedores.filter(f => f.lancamentos.length > 0);
  return NextResponse.json(filtrados);
}