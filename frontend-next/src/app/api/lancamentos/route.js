import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// LISTAR (GET) - Mantive igual
// LISTAR (GET)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filialId = searchParams.get('filial_id');
    const busca = searchParams.get('busca'); // <--- Novo parâmetro
    
    // Configuração inicial do filtro
    let where = {};

    // 1. Filtro de Filial (sempre respeitado se existir)
    if (filialId) where.filial_id = parseInt(filialId);

    // 2. Lógica da Busca Global
    if (busca && busca.trim() !== '') {
      const termo = busca.trim();
      const isNumber = !isNaN(parseFloat(termo)) && isFinite(termo);

      where.OR = [
        // Busca textual (insensível a maiúsculas/minúsculas)
        { numero_nota: { contains: termo, mode: 'insensitive' } },
        { numero_pedido: { contains: termo, mode: 'insensitive' } },
        { solicitacao_fluig: { contains: termo, mode: 'insensitive' } },
        { numero_medicao: { contains: termo, mode: 'insensitive' } },
        { cnpj_usado: { contains: termo, mode: 'insensitive' } },
        { descricao_servico: { contains: termo, mode: 'insensitive' } }, // Bônus: busca na descrição
        // Busca dentro da relação com Fornecedor
        { fornecedor: { nome_empresa: { contains: termo, mode: 'insensitive' } } },
        { fornecedor: { lista_cnpjs: { contains: termo, mode: 'insensitive' } } }
      ];

      // Se o termo for um número, tenta buscar pelo VALOR exato também
      if (isNumber) {
        where.OR.push({ valor: { equals: parseFloat(termo) } });
      }
    } 
    
    // ATENÇÃO: Se NÃO tiver busca, você provavelmente quer filtrar por mês no Dashboard
    // Mas esta rota '/api/lancamentos' é usada tanto para listar tudo quanto para busca.
    // O Dashboard usa '/api/dados-agrupados'. 
    // Se você estiver usando essa rota para uma "Lista Geral", ok.
    
    console.log("🔍 Buscando lançamentos com filtro:", JSON.stringify(where));

    const dados = await prisma.lancamentos.findMany({
      where,
      include: { 
        filial: true, 
        fornecedor: true 
      },
      orderBy: { id: 'desc' },
      take: 100 // Limite de segurança para não travar se buscar "a"
    });

    return NextResponse.json(dados);
  } catch (error) {
    console.error("❌ ERRO NO GET LANCAMENTOS:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


// CRIAR (POST COM LÓGICA DE REPETIÇÃO)
export async function POST(request) {
  try {
    const data = await request.json();
    console.log("📥 Recebendo lançamento (Repetição):", data.repetir_por);

    // Validação básica
    if (!data.filial_id || !data.fornecedor_id || !data.valor) {
        throw new Error("Dados obrigatórios faltando");
    }

    const repeticoes = parseInt(data.repetir_por || '1');
    const lancamentosParaCriar = [];
    const dataBase = new Date(data.data_vencimento);

    // LOOP PARA GERAR AS CÓPIAS
    for (let i = 0; i < repeticoes; i++) {
        // Calcula a data do mês (Mês atual + i)
        // Nota: O Javascript lida bem com virada de ano (12+1 vira mês 1 do ano seguinte)
        const novaDataVencimento = new Date(dataBase);
        novaDataVencimento.setMonth(dataBase.getMonth() + i);

        // Lógica: 
        // Se i == 0 (Primeiro mês): Usa os dados exatos (Nota, Arquivo, Status).
        // Se i > 0 (Meses futuros): Limpa Nota, Arquivo e define status como "Aguardando Fatura".
        
        const isFuturo = i > 0;

        lancamentosParaCriar.push({
            filial_id: parseInt(data.filial_id),
            fornecedor_id: parseInt(data.fornecedor_id),
            valor: parseFloat(data.valor),
            
            // Futuro não tem número de nota ainda
            numero_nota: isFuturo ? `PREV-${i}` : String(data.numero_nota), 
            serie: data.serie || 'U',
            
            data_vencimento: novaDataVencimento,
            // Futuro não foi enviado ainda
            data_envio: isFuturo ? null : (data.data_envio ? new Date(data.data_envio) : null),

            // Opcionais
            cnpj_usado: data.cnpj_usado || null,
            contrato_usado: data.contrato_usado || null,
            centro_custo_usado: data.centro_custo_usado || null,
            descricao_servico: data.descricao_servico || null,
            servico_protheus: data.servico_protheus || null,
            numero_medicao: data.numero_medicao || null,
            numero_pedido: data.numero_pedido || null,
            solicitacao_fluig: data.solicitacao_fluig || null,
            observacao: isFuturo ? `Parcela ${i+1}/${repeticoes} - ${data.observacao || ''}` : data.observacao || null,
            
            // Futuro sempre começa como "Aguardando Fatura" ou "Pendente"
            status_pagamento: isFuturo ? 'Aguardando Fatura' : (data.status_pagamento || 'Pendente Lançamento'),
            
            // Futuro não tem arquivo
            arquivo_nota: isFuturo ? null : (data.arquivo_nota || null),
            arquivo_boleto: isFuturo ? null : (data.arquivo_boleto || null),
        });
    }

    // TRANSACÃO: Salva tudo de uma vez. Se der erro em um, cancela tudo.
    // createMany é muito mais rápido que fazer um loop de create
    const resultado = await prisma.lancamentos.createMany({
        data: lancamentosParaCriar
    });
    
    console.log(`✅ Sucesso! Criados ${resultado.count} lançamentos.`);
    
    return NextResponse.json({ 
        success: true, 
        count: resultado.count, 
        message: `${resultado.count} lançamentos gerados com sucesso!` 
    });

  } catch (error) {
    console.error("❌ ERRO AO SALVAR EM LOTE:", error);
    return NextResponse.json({ 
      error: "Erro ao salvar", 
      details: error.message 
    }, { status: 500 });
  }
}