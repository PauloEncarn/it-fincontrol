import { NextResponse } from 'next/server';

export async function GET() {
  // NÃO mostramos os valores reais por segurança, apenas se existe ou não.
  return NextResponse.json({
    status: "Diagnóstico de Variáveis",
    checks: {
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ OK' : '❌ FALTANDO',
      SUPABASE_KEY_ADMIN: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ OK' : '❌ FALTANDO',
      GMAIL_USER: process.env.GMAIL_USER ? '✅ OK' : '❌ FALTANDO',
      GMAIL_PASS: process.env.GMAIL_PASS ? '✅ OK' : '❌ FALTANDO',
      JWT_SECRET: process.env.JWT_SECRET ? '✅ OK' : '❌ FALTANDO',
      APP_URL: process.env.APP_URL ? '✅ OK' : '❌ FALTANDO',
    },
    app_url_valor: process.env.APP_URL // Esse não tem problema mostrar para conferir se não tem barra dupla
  });
}