import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import path from 'path';
// Importa a função que cria o visual do e-mail
import { gerarEmailHtml } from '@/utils/emailTemplate'; 

export async function POST(request) {
  try {
    const data = await request.json();
    const { numero_nota, fornecedor, valor, vencimento, arquivos } = data;

    // 1. CONFIGURAÇÃO DO SMTP
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL.USER ,
        pass: process.env.GMAIL.PASSWORD // Recomendo usar variável de ambiente aqui
      },
      tls: { rejectUnauthorized: false }
    });

    // 2. PREPARAR ANEXOS
    const attachments = arquivos
        .filter((url) => url && typeof url === 'string' && url.length > 0)
        .map((url) => {
            const isUrl = url.startsWith('http') || url.startsWith('https');
            
            // Lógica para extrair o nome real
            let originalName = url.split('/').pop();
            originalName = originalName.split('?')[0];
            originalName = decodeURIComponent(originalName);

            if (isUrl) {
                return {
                    filename: originalName,
                    path: url 
                };
            } else {
                const cleanPath = url.startsWith('/') ? url.slice(1) : url;
                const fullPath = path.join(process.cwd(), 'public', cleanPath);
                return {
                    filename: originalName,
                    path: fullPath
                };
            }
        });

    // 3. GERAR O HTML BONITO 🎨
    // Precisamos passar os dados com os nomes que a função espera
    const htmlBody = gerarEmailHtml({
        fornecedor: fornecedor,
        numero_nota: numero_nota,
        valor: parseFloat(valor),
        data_vencimento: vencimento
    });

    // 4. TEXTO PURO (FALLBACK)
    // Mantemos isso caso o servidor de e-mail da balança bloqueie HTML
    const textBody = `
Prezados,

Segue boleto e nota para pagamento.

Fornecedor: ${fornecedor}
Nota Fiscal: ${numero_nota}
Valor: R$ ${parseFloat(valor).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
Vencimento: ${new Date(vencimento).toLocaleDateString('pt-BR')}

Atenciosamente,
Equipe TI - IT FinControl
    `;

    // 5. DISPARAR
    await transporter.sendMail({
      from: '"Financeiro TI" <automacaocicopal@gmail.com>',
      to: "suporte.ba@cicopal.com.br",
      subject: `NF: ${numero_nota} - ${fornecedor}`,
      text: textBody, // Versão texto simples
      html: htmlBody, // Versão HTML bonita (O Gmail vai priorizar essa)
      attachments: attachments
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("❌ Erro ao enviar e-mail:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}