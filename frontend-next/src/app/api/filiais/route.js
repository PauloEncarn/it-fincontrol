import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const dados = await prisma.filiais.findMany({ orderBy: { nome_fantasia: 'asc' } });
  return NextResponse.json(dados);
}

export async function POST(request) {
  const data = await request.json();
  const novo = await prisma.filiais.create({ data });
  return NextResponse.json(novo);
}