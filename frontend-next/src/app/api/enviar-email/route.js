import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import path from 'path';

/**
 * @param {Request} request
 */
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
      user: "automacaocicopal@gmail.com", // ⚠️ SEU EMAIL AQUI
        pass: "vtsm kxqp hsjd vbib",           // ⚠️ SUA SENHA AQUI
      },
      tls: { rejectUnauthorized: false }
    });

   // 2. PREPARAR ANEXOS (CORRIGIDO PARA PEGAR O NOME REAL)
    const attachments = arquivos
        .filter((url) => url && typeof url === 'string' && url.length > 0)
        .map((url) => {
            const isUrl = url.startsWith('http') || url.startsWith('https');
            
            // Lógica para extrair o nome real do arquivo da URL/Caminho
            // 1. Pega a última parte depois da barra '/'
            let originalName = url.split('/').pop();
            
            // 2. Remove parâmetros de URL se existirem (tudo depois de '?')
            originalName = originalName.split('?')[0];

            // 3. Decodifica caracteres especiais (ex: espaço que vira %20)
            originalName = decodeURIComponent(originalName);

            if (isUrl) {
                return {
                    filename: originalName, // Usa o nome real (ex: boleto.pdf)
                    path: url 
                };
            } else {
                // Lógica para arquivo local (se houver)
                const cleanPath = url.startsWith('/') ? url.slice(1) : url;
                const fullPath = path.join(process.cwd(), 'public', cleanPath);
                return {
                    filename: originalName,
                    path: fullPath
                };
            }
        });
    // 3. TEXTO DO E-MAIL
    const mensagem = `
Prezados,

Segue boleto e nota para pagamento.

Fornecedor: ${fornecedor}
Nota Fiscal: ${numero_nota}
Valor: R$ ${parseFloat(valor).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
Vencimento: ${new Date(vencimento).toLocaleDateString('pt-BR')}

Atenciosamente,
Equipe TI
    `;

    // 4. DISPARAR
    await transporter.sendMail({
      from: '"Financeiro TI" <automacaocicopal@gmail.com',
      to: "suporte.ba@cicopal.com.br",
      subject: `NF: ${numero_nota} - ${fornecedor}`,
      text: mensagem,
      attachments: attachments
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("❌ Erro ao enviar e-mail:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}