import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import path from 'path';
import jwt from 'jsonwebtoken';
import { gerarEmailHtml } from '@/backend/utils/emailTemplate'; 

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const formatDateBr = (value) => {
  if (!value) return '-';
  const [dateOnly] = String(value).split('T');
  const parts = dateOnly.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateOnly;
};

const diasAteVencimento = (value) => {
  if (!value) return null;
  const [dateOnly] = String(value).split('T');
  const [year, month, day] = dateOnly.split('-').map(Number);
  if (!year || !month || !day) return null;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const vencimento = new Date(year, month - 1, day);
  vencimento.setHours(0, 0, 0, 0);
  return Math.ceil((vencimento.getTime() - hoje.getTime()) / 86400000);
};

const saudacaoAtual = () => {
  const hora = Number(new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    hour12: false,
    timeZone: 'America/Sao_Paulo',
  }).format(new Date()));

  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
};

const renderEmailGopa = ({ fornecedor, numero_nota, vencimento, numero_pedido, numero_medicao, linkOk }) => {
  const vencimentoFormatado = formatDateBr(vencimento);
  const dias = diasAteVencimento(vencimento);
  const prazoTexto = dias === null
    ? 'Prazo nao informado.'
    : dias < 0
      ? `A nota esta vencida ha ${Math.abs(dias)} dias.`
      : dias === 0
        ? 'A nota vence hoje.'
        : `Faltam ${dias} dias para o vencimento.`;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body style="margin:0; padding:0; background:#f3f2f1; font-family:'Segoe UI', Arial, sans-serif; color:#201f1e;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f2f1; padding:24px 0;">
          <tr>
            <td align="center">
              <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="max-width:640px; width:94%; background:#ffffff; border:1px solid #edebe9;">
                <tr>
                  <td style="background:#0078d4; padding:18px 24px; color:#ffffff;">
                    <div style="font-size:12px; letter-spacing:.08em; text-transform:uppercase; font-weight:700;">Cicopal</div>
                    <div style="font-size:22px; font-weight:700; margin-top:4px;">Encaminhamento de documentos fiscais</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px;">
                    <p style="font-size:16px; margin:0 0 16px 0;">${saudacaoAtual()},</p>
                    <p style="font-size:15px; line-height:1.6; margin:0 0 18px 0;">
                      Segue anexo nota e boleto do <strong>${escapeHtml(fornecedor)}</strong> com vencimento para <strong>${vencimentoFormatado}</strong>.
                    </p>

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse; margin:18px 0; border:1px solid #edebe9;">
                      <tr>
                        <td style="padding:12px 14px; background:#faf9f8; width:42%; font-weight:700;">Nota fiscal</td>
                        <td style="padding:12px 14px;">${escapeHtml(numero_nota || '-')}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 14px; background:#faf9f8; font-weight:700;">Fornecedor</td>
                        <td style="padding:12px 14px;">${escapeHtml(fornecedor || '-')}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 14px; background:#faf9f8; font-weight:700;">Vencimento</td>
                        <td style="padding:12px 14px;">${vencimentoFormatado}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 14px; background:#faf9f8; font-weight:700;">Pedido</td>
                        <td style="padding:12px 14px;">${escapeHtml(numero_pedido || '-')}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 14px; background:#faf9f8; font-weight:700;">Medicao</td>
                        <td style="padding:12px 14px;">${escapeHtml(numero_medicao || '-')}</td>
                      </tr>
                    </table>

                    <div style="border-left:5px solid #ffb900; background:#fff4ce; padding:12px 14px; margin:18px 0; font-weight:700; color:#8a5a00;">
                      ${prazoTexto}
                    </div>

                    <p style="font-size:14px; color:#605e5c; margin:18px 0;">
                      Remetente: IT FinControl - Financeiro Cicopal
                    </p>

                    <div style="text-align:center; margin-top:26px;">
                      <a href="${linkOk}" target="_blank" style="background:#107c10; color:#ffffff; text-decoration:none; padding:13px 22px; border-radius:4px; font-weight:700; display:inline-block;">
                        Confirmar pagamento concluido
                      </a>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="background:#faf9f8; border-top:1px solid #edebe9; padding:14px 24px; font-size:12px; color:#605e5c;">
                    Mensagem automatica do IT FinControl.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

export async function POST(request) {
  try {
    const data = await request.json();
    const { id, numero_nota, fornecedor, valor, vencimento, arquivos, tipo, numero_pedido, numero_medicao } = data;
    const isGopa = tipo === 'gopa';

    // 1. TRAVA DE SEGURANÇA: MÊS CORRENTE
    const dataVencimento = new Date(vencimento);
    const dataHoje = new Date();
    
    const mesmoAno = dataVencimento.getUTCFullYear() === dataHoje.getUTCFullYear();
    const mesmoMes = dataVencimento.getUTCMonth() === dataHoje.getUTCMonth();

    if (!isGopa && (!mesmoAno || !mesmoMes)) {
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

        htmlBotoes = isGopa ? `
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
                <a href="${linkOk}" target="_blank" style="background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
                    Confirmar Pagamento
                </a>
                <p style="font-size: 11px; color: #9ca3af; margin-top: 15px;">O sistema será atualizado automaticamente ao clicar.</p>
            </div>
        ` : `
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
    let htmlBase = isGopa ? renderEmailGopa({
        fornecedor,
        numero_nota,
        vencimento,
        numero_pedido,
        numero_medicao,
        linkOk: id && process.env.JWT_SECRET
          ? `${process.env.APP_URL || 'http://localhost:3000'}/api/feedback?token=${jwt.sign({ id, action: 'autorizar' }, process.env.JWT_SECRET, { expiresIn: '7d' })}`
          : '#',
    }) : gerarEmailHtml({
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
    if (!isGopa && htmlBotoes) {
        if (htmlFinal.includes('</body>')) {
            htmlFinal = htmlFinal.replace('</body>', `${htmlBotoes}</body>`);
        } else {
            htmlFinal += htmlBotoes;
        }
    }

    // 6. ENVIAR
    await transporter.sendMail({
      from: `"Financeiro Cicopal" <${process.env.GMAIL_USER || 'automacaocicopal@gmail.com'}>`,
      to: isGopa ? "paulo.encarnacao@cicopal.com.br" : "suporte.ba@cicopal.com.br, contratos.ti@cicopal.com.br",
      subject: isGopa
        ? `NF ${numero_nota} - ${fornecedor} - Venc. ${formatDateBr(vencimento)}`
        : `NF: ${numero_nota} - ${fornecedor}`,
      text: isGopa
        ? `${saudacaoAtual()}. Segue anexo nota e boleto do ${fornecedor} com vencimento para ${formatDateBr(vencimento)}. Pedido: ${numero_pedido || '-'}. Medicao: ${numero_medicao || '-'}.`
        : `Nota Fiscal ${numero_nota} - Valor R$ ${valor}.`,
      html: htmlFinal,
      attachments: attachments
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Erro envio email:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
