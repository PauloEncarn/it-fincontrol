import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const users = await prisma.usuarios.findMany();
  return NextResponse.json(users);
}

export async function POST(request) {
  const data = await request.json();
  // Aqui você deveria hashear a senha antes de salvar com bcrypt
  const novo = await prisma.usuarios.create({
    data: {
      username: data.username,
      password_hash: data.password, // Mude para hash real depois
      nome_completo: data.nome_completo,
      cpf: data.cpf,
      setor: data.setor,
      cargo: data.cargo
    }
  });
  return NextResponse.json(novo);
}