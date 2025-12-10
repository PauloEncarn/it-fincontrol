import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { SignJWT } from 'jose';

const SECRET_KEY = new TextEncoder().encode("SEGREDO_SUPER_SECRETO_DA_CICOPAL");

export async function POST(request) {
  const formData = await request.formData();
  const username = formData.get('username');
  const password = formData.get('password'); // Em produção, use bcrypt para validar hash

  const user = await prisma.usuarios.findUnique({
    where: { username: username }
  });

  // Validação simples (melhore com bcrypt.compare se tiver hash real)
  if (!user) {
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
  }

  // Gera o Token JWT
  const token = await new SignJWT({ sub: user.username })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('10h')
    .sign(SECRET_KEY);

  return NextResponse.json({ access_token: token, token_type: 'bearer' });
}