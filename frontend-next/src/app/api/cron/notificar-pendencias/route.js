import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

// 1. INICIAR O CLIENTE SUPABASE COM PODERES DE ADMIN
// Ele vai ler as chaves que colocamos no .env.local
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// CONFIGURAÇÃO DOS STATUS QUE GERAM ALERTA
const STATUS_ALERTA = [
  'Aguardando Fatura',
  'Pendente Lançamento',
  'Aguardando Pagamento'
];

export async function GET(request) {
  // --- VERIFICAÇÃO DE SEGURANÇA (CRON SECRET) ---
  // Impede que qualquer pessoa na internet dispare o e-mail acessando o link
  const authHeader = request.headers.get('authorization');
  
  // Se tiver configurado o CRON_SECRET no ambiente, ele checa.
  // Para testar no navegador localmente, você pode comentar essas 3 linhas abaixo temporariamente.
  /*
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Acesso Negado: Chave Cron Inválida' }, { status: 401 });
  }
*/
  try {
    console.log("🤖 Robô iniciado: Buscando pendências no Supabase...");

    // 2. BUSCAR DADOS NO BANCO
    // Estamos acessando a tabela 'lancamentos' e pegando os dados das tabelas relacionadas
    const { data: pendencias, error } = await supabase
      .from('lancamentos') 
      .select(`
        *,
        fornecedores ( nome_empresa ),
        filiais ( nome_fantasia )
      `)
      .in('status_pagamento', STATUS_ALERTA)
      .order('data_vencimento', { ascending: true });

    if (error) {
      console.error("Erro Supabase:", error);
      throw new Error("Falha ao buscar dados no Supabase: " + error.message);
    }

    if (!pendencias || pendencias.length === 0) {
      console.log("✅ Nenhuma pendência encontrada hoje.");
      return NextResponse.json({ message: "Nenhuma pendência hoje." });
    }

    // 3. MONTAR O HTML DO EMAIL
    const linhasTabela = pendencias.map(n => {
        const venc = new Date(n.data_vencimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
        const valor = parseFloat(n.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        // Cores das etiquetas
        let corStatus = '#F9C531'; // Amarelo
        if (n.status_pagamento.includes('Pendente')) corStatus = '#E30613'; // Vermelho
        if (n.status_pagamento.includes('Pagamento')) corStatus = '#1E22A8'; // Azul

        // Tratamento para pegar o nome caso venha como array ou objeto
        const nomeFornecedor = Array.isArray(n.fornecedores) ? n.fornecedores[0]?.nome_empresa : n.fornecedores?.nome_empresa;
        const nomeFilial = Array.isArray(n.filiais) ? n.filiais[0]?.nome_fantasia : n.filiais?.nome_fantasia;

        return `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px; color: #555; font-size: 11px;">${nomeFilial || '-'}</td>
            <td style="padding: 10px; color: #333; font-weight: bold;">${nomeFornecedor || 'Desconhecido'}</td>
            <td style="padding: 10px; color: #333;">${n.numero_nota}</td>
            <td style="padding: 10px; color: #333; font-weight: bold;">${valor}</td>
            <td style="padding: 10px; color: #333;">${venc}</td>
            <td style="padding: 10px;">
                <span style="background-color: ${corStatus}20; color: ${corStatus}; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; border: 1px solid ${corStatus}; white-space: nowrap;">
                    ${n.status_pagamento}
                </span>
            </td>
          </tr>
        `;
    }).join('');

    const htmlEmail = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; color: #333; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #1E22A8; padding: 24px;">
            <h2 style="color: white; margin: 0; font-size: 20px;">Resumo Diário de Pendências</h2>
            <p style="color: #a5b4fc; margin: 5px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Cicopal Financeiro TI</p>
        </div>
        
        <div style="padding: 24px; background-color: #fff;">
            <p style="margin-top: 0;">Olá,</p>
            <p>Identificamos <strong>${pendencias.length} lançamentos</strong> que requerem atenção hoje:</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px;">
                <thead>
                    <tr style="background-color: #f8fafc; text-align: left; border-bottom: 2px solid #e2e8f0;">
                        <th style="padding: 12px 10px; color: #64748b; font-size: 11px; text-transform: uppercase;">Filial</th>
                        <th style="padding: 12px 10px; color: #64748b; font-size: 11px; text-transform: uppercase;">Fornecedor</th>
                        <th style="padding: 12px 10px; color: #64748b; font-size: 11px; text-transform: uppercase;">NF</th>
                        <th style="padding: 12px 10px; color: #64748b; font-size: 11px; text-transform: uppercase;">Valor</th>
                        <th style="padding: 12px 10px; color: #64748b; font-size: 11px; text-transform: uppercase;">Vencimento</th>
                        <th style="padding: 12px 10px; color: #64748b; font-size: 11px; text-transform: uppercase;">Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${linhasTabela}
                </tbody>
            </table>

            <div style="margin-top: 30px; text-align: center;">
                <a href="https://cicopal-financeiro-ti.vercel.app" style="background-color: #E30613; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
                    Acessar Sistema
                </a>
            </div>
        </div>
        <div style="background-color: #f8fafc; padding: 15px; text-align: center; color: #94a3b8; font-size: 11px;">
            Este é um e-mail automático gerado pelo sistema.
        </div>
      </div>
    `;

    // 4. CONFIGURAÇÃO DE ENVIO (SMTP GMAIL)
    // ⚠️ Certifique-se de que seu EMAIL e SENHA DE APP estão corretos aqui ou no .env
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "automacaocicopal@gmail.com", // ⚠️ SUBSTITUA PELO SEU EMAIL REAL
        pass: "vtsm kxqp hsjd vbib",    // ⚠️ SUBSTITUA PELA SENHA DE APP DE 16 DÍGITOS
      },
      tls: { rejectUnauthorized: false }
    });

    console.log("📨 Enviando e-mail...");
    
    await transporter.sendMail({
      from: '"Robô Financeiro" <automacaocicopal@gmail.com.br>',
      to: "suporte.ba@cicopal.com.br", // ⚠️ QUEM VAI RECEBER O RELATÓRIO
      subject: `🚨 [Pendências] ${pendencias.length} notas aguardam atenção`,
      html: htmlEmail
    });

    console.log("✅ E-mail enviado com sucesso!");
    return NextResponse.json({ success: true, enviados: pendencias.length });

  } catch (error) {
    console.error("❌ Erro fatal no Cron:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}