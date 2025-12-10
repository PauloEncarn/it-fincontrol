import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request, props) {
  try {
    // 1. CORREÇÃO: Await no params
    const params = await props.params;
    const id = parseInt(params.id);

    const data = await request.json();
    const { id: _, ...rest } = data; // Remove ID do corpo

    const atualizado = await prisma.filiais.update({
      where: { id },
      data: rest
    });
    return NextResponse.json(atualizado);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, props) {
  try {
    const params = await props.params;
    const id = parseInt(params.id);

    await prisma.filiais.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}