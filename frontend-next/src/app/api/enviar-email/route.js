import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import path from 'path';
import jwt from 'jsonwebtoken';
import { gerarEmailHtml } from '@/utils/emailTemplate'; 

export async function POST(request) {
  try {
    const data = await request.json();
    const { id, numero_nota, fornecedor, valor, vencimento, arquivos } = data;

    // 1. TRAVA DE SEGURANÇA: MÊS CORRENTE
    const dataVencimento = new Date(vencimento);
    const dataHoje = new Date();
    
    const mesmoAno = dataVencimento.getUTCFullYear() === dataHoje.getUTCFullYear();
    const mesmoMes = dataVencimento.getUTCMonth() === dataHoje.getUTCMonth();

    if (!mesmoAno || !mesmoMes) {
        return NextResponse.json({ success: false, message: "Envio bloqueado: Nota fora do mês corrente." });
    }

    // 2. GERAR LINKS DE AÇÃO
    let htmlBotoes = '';
    
    if (id && process.env.JWT_SECRET) {
        const baseUrl = process.env.APP_URL || 'http://localhost:3000';

        // Token APROVAR (Vai virar CONCLUÍDA)
        const tokenOk = jwt.sign({ id, action: 'autorizar' }, process.env.JWT_SECRET, { expiresIn: '7d' });
        const linkOk = `${baseUrl}/api/feedback?token=${tokenOk}`;

        // Token REJEITAR (Vai virar AGUARDANDO PAGAMENTO)
        const tokenFail = jwt.sign({ id, action: 'sem_saldo' }, process.env.JWT_SECRET, { expiresIn: '7d' });
        const linkFail = `${baseUrl}/api/feedback?token=${tokenFail}`;

        htmlBotoes = `
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
                <p style="font-size: 14px; color: #6b7280; margin-bottom: 15px;"><strong>Selecione uma ação para atualizar o sistema:</strong></p>
                
                <a href="${linkOk}" target="_blank" style="background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; margin-right: 15px; display: inline-block;">
                    ✅ Confirmar Pagamento
                </a>

                <a href="${linkFail}" target="_blank" style="background-color: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
                    💰 Informar Sem Saldo
                </a>
                
                <p style="font-size: 11px; color: #9ca3af; margin-top: 15px;">O status será atualizado automaticamente ao clicar.</p>
            </div>
        `;
    }

    // 3. CONFIGURAÇÃO DO SMTP
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "automacaocicopal@gmail.com",
        pass: "vtsm kxqp hsjd vbib"
      },
      tls: { rejectUnauthorized: false }
    });

    // 4. PREPARAR ANEXOS
    const attachments = arquivos && Array.isArray(arquivos) 
        ? arquivos
            .filter((url) => url && typeof url === 'string' && url.length > 0)
            .map((url) => {
                const isUrl = url.startsWith('http');
                let originalName = url.split('/').pop().split('?')[0];
                originalName = decodeURIComponent(originalName);

                if (isUrl) {
                    return { filename: originalName, path: url };
                } else {
                    const cleanPath = url.startsWith('/') ? url.slice(1) : url;
                    const fullPath = path.join(process.cwd(), 'public', cleanPath);
                    return { filename: originalName, path: fullPath };
                }
            })
        : [];

    // 5. MONTAR O E-MAIL
    // Gera o visual da nota
    let htmlBase = gerarEmailHtml({
        fornecedor,
        numero_nota,
        valor: parseFloat(valor),
        data_vencimento: vencimento
    });

    // Remove o botão "Acessar Sistema" se ele existir no template base (Substituição de string)
    // Se o seu gerarEmailHtml tiver um botão com texto "Acessar Sistema", isso vai removê-lo
    // Ajuste o texto do replace conforme está no seu utils/emailTemplate.js
    htmlBase = htmlBase.replace(/<a[^>]*>.*?Acessar Sistema.*?<\/a>/gi, '');

    // Injeta os botões de ação no final
    let htmlFinal = htmlBase;
    if (htmlBotoes) {
        if (htmlFinal.includes('</body>')) {
            htmlFinal = htmlFinal.replace('</body>', `${htmlBotoes}</body>`);
        } else {
            htmlFinal += htmlBotoes;
        }
    }

    // 6. ENVIAR
    await transporter.sendMail({
      from: `"Financeiro TI" <${process.env.GMAIL_USER}>`,
      to: "suporte.ba@cicopal.com.br, contratos.ti@cicopal.com.br",
      subject: `NF: ${numero_nota} - ${fornecedor}`,
      text: `Nota Fiscal ${numero_nota} - Valor R$ ${valor}.`,
      html: htmlFinal,
      attachments: attachments
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Erro envio email:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}