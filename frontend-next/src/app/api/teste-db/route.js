import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 1. Verifica qual URL o sistema carregou (Mascara a senha)
    const dbUrl = process.env.DATABASE_URL || "NÃO ENCONTRADA";
    const urlMascarada = dbUrl.replace(/:([^:@]+)@/, ':****@');

    console.log("🔍 URL Carregada no Node:", urlMascarada);

    // 2. Tenta conectar e contar as filiais
    const totalFiliais = await prisma.filiais.count();

    return NextResponse.json({
      status: "SUCESSO",
      mensagem: "Banco conectado!",
      url_usada: urlMascarada, // Veja se aqui aparece 6543 ou 5432
      total_filiais: totalFiliais
    });

  } catch (error) {
    console.error("❌ ERRO NO TESTE:", error);
    return NextResponse.json({
      status: "ERRO",
      tipo_erro: error.name,
      mensagem: error.message,
      codigo_prisma: error.code // Ex: P1001 (Conexão), P2002 (Único), etc
    }, { status: 500 });
  }
}