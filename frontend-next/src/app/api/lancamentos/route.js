import { NextResponse } from 'next/server'; // <--- O erro acontecia porque faltava essa linha!
import prisma from '@/lib/prisma';

// LISTAR (GET)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filialId = searchParams.get('filial_id');
    
    const where = {};
    if (filialId) where.filial_id = parseInt(filialId);

    console.log("🔍 Buscando lançamentos...");

    const dados = await prisma.lancamentos.findMany({
      where,
      include: {
        // Lembre-se: Singular porque mudamos no schema.prisma
        filial: true,      
        fornecedor: true   
      },
      orderBy: { id: 'desc' }
    });

    return NextResponse.json(dados);
  } catch (error) {
    console.error("❌ ERRO NO GET LANCAMENTOS:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// CRIAR (POST)
export async function POST(request) {
  try {
    const data = await request.json();
    console.log("📥 DADOS RECEBIDOS:", JSON.stringify(data, null, 2));

    // 1. Validação Manual dos Campos Obrigatórios
    if (!data.filial_id) throw new Error("Campo Obrigatório: Filial");
    if (!data.fornecedor_id) throw new Error("Campo Obrigatório: Fornecedor");
    if (!data.valor) throw new Error("Campo Obrigatório: Valor");
    if (!data.numero_nota) throw new Error("Campo Obrigatório: Número da Nota");

    // 2. Preparação dos Dados (Conversão de Tipos)
    const cleanData = {
      filial_id: parseInt(data.filial_id),
      fornecedor_id: parseInt(data.fornecedor_id),
      valor: parseFloat(data.valor),
      numero_nota: String(data.numero_nota),
      
      // Datas: Se vier vazio ou inválido, usa a data atual para não travar
      data_vencimento: data.data_vencimento ? new Date(data.data_vencimento) : new Date(),
      data_envio: data.data_envio ? new Date(data.data_envio) : null,

      // Campos Opcionais
      cnpj_usado: data.cnpj_usado || null,
      contrato_usado: data.contrato_usado || null,
      centro_custo_usado: data.centro_custo_usado || null,
      serie: data.serie || 'U',
      descricao_servico: data.descricao_servico || null,
      servico_protheus: data.servico_protheus || null,
      numero_medicao: data.numero_medicao || null,
      numero_pedido: data.numero_pedido || null,
      solicitacao_fluig: data.solicitacao_fluig || null,
      observacao: data.observacao || null,
      status_pagamento: data.status_pagamento || 'Pendente Lançamento',
      arquivo_nota: data.arquivo_nota || null,
      arquivo_boleto: data.arquivo_boleto || null,
    };

    console.log("🛠️ SALVANDO NO BANCO...", cleanData);

    const novo = await prisma.lancamentos.create({ data: cleanData });
    
    console.log("✅ SUCESSO! ID:", novo.id);
    return NextResponse.json(novo);

  } catch (error) {
    console.error("❌ ERRO CRÍTICO AO SALVAR:", error);
    
    // Retorna o erro detalhado para o navegador
    return NextResponse.json({ 
      error: "Falha ao salvar lançamento", 
      details: error.message 
    }, { status: 500 });
  }
}