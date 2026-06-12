import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const STATUS_PENDENCIA = [
  'Pendente Nota',
  'Pendente Boleto',
  'Pendente Fatura',
  'Em Andamento',
  'Aguardando Fatura',
  'Pendente Lançamento',
];

const STATUS_LEMBRETE = [
  'Aguardando Aprovação Fluig',
  'Aguardando Confirmação Refresa',
  'Aguardando Contingência Gerente',
  'Aguardando Contingência Head',
];

export const dynamic = 'force-dynamic';

const moeda = (value) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const dataBR = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
  return date.toLocaleDateString('pt-BR');
};

const nomeRelacionado = (value, key) => {
  if (Array.isArray(value)) return value[0]?.[key];
  return value?.[key];
};

function linhasTabela(lista) {
  return lista.map((nota) => {
    const fornecedor = nomeRelacionado(nota.fornecedores, 'nome_empresa') || 'Desconhecido';
    const filial = nomeRelacionado(nota.filiais, 'nome_fantasia') || '-';
    const status = nota.status_pagamento || 'Sem status';
    const corStatus = status.includes('Contingência')
      ? '#d13438'
      : status.includes('Aguardando')
        ? '#0078d4'
        : '#f9c531';

    return `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px; color: #555; font-size: 11px;">${filial}</td>
        <td style="padding: 10px; color: #333; font-weight: bold;">${fornecedor}</td>
        <td style="padding: 10px; color: #333;">${nota.numero_nota || '-'}</td>
        <td style="padding: 10px; color: #333; font-weight: bold;">${moeda(nota.valor)}</td>
        <td style="padding: 10px; color: #333;">${dataBR(nota.data_vencimento)}</td>
        <td style="padding: 10px;">
          <span style="background-color: ${corStatus}20; color: ${corStatus}; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; border: 1px solid ${corStatus}; white-space: nowrap;">
            ${status}
          </span>
        </td>
        <td style="padding: 10px; color: #555;">${nota.observacao || '-'}</td>
      </tr>
    `;
  }).join('');
}

function tabela(titulo, descricao, lista) {
  if (!lista.length) return '';

  return `
    <h3 style="margin: 26px 0 6px; color: #1f2937;">${titulo}</h3>
    <p style="margin: 0 0 12px; color: #4b5563;">${descricao}</p>
    <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px;">
      <thead>
        <tr style="background-color: #f8fafc; text-align: left; border-bottom: 2px solid #e2e8f0;">
          <th style="padding: 12px 10px; color: #64748b; font-size: 11px; text-transform: uppercase;">Filial</th>
          <th style="padding: 12px 10px; color: #64748b; font-size: 11px; text-transform: uppercase;">Fornecedor</th>
          <th style="padding: 12px 10px; color: #64748b; font-size: 11px; text-transform: uppercase;">NF</th>
          <th style="padding: 12px 10px; color: #64748b; font-size: 11px; text-transform: uppercase;">Valor</th>
          <th style="padding: 12px 10px; color: #64748b; font-size: 11px; text-transform: uppercase;">Vencimento</th>
          <th style="padding: 12px 10px; color: #64748b; font-size: 11px; text-transform: uppercase;">Status</th>
          <th style="padding: 12px 10px; color: #64748b; font-size: 11px; text-transform: uppercase;">Observação</th>
        </tr>
      </thead>
      <tbody>${linhasTabela(lista)}</tbody>
    </table>
  `;
}

export async function GET() {
  try {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth();
    const diaSemana = hoje.getDay();
    const diaUtil = diaSemana >= 1 && diaSemana <= 5;

    const primeiroDia = new Date(ano, mes, 1).toISOString();
    const ultimoDia = new Date(ano, mes + 1, 0, 23, 59, 59).toISOString();

    const selectRelacoes = `
      *,
      fornecedores ( nome_empresa ),
      filiais ( nome_fantasia )
    `;

    const { data: pendencias = [], error: erroPendencias } = await supabase
      .from('lancamentos')
      .select(selectRelacoes)
      .in('status_pagamento', STATUS_PENDENCIA)
      .gte('data_vencimento', primeiroDia)
      .lte('data_vencimento', ultimoDia)
      .order('data_vencimento', { ascending: true });

    if (erroPendencias) throw erroPendencias;

    let lembretes = [];
    if (diaUtil) {
      const { data, error } = await supabase
        .from('lancamentos')
        .select(selectRelacoes)
        .in('status_pagamento', STATUS_LEMBRETE)
        .order('data_vencimento', { ascending: true });

      if (error) throw error;
      lembretes = data || [];
    }

    if (!pendencias.length && !lembretes.length) {
      return NextResponse.json({ message: 'Nenhuma pendência ou lembrete para enviar.' });
    }

    const htmlEmail = `
      <div style="font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto; color: #333; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #1E22A8; padding: 24px;">
          <h2 style="color: white; margin: 0; font-size: 20px;">Acompanhamento de notas</h2>
          <p style="color: #c7d2fe; margin: 5px 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Cicopal Financeiro TI</p>
        </div>
        <div style="padding: 24px; background-color: #fff;">
          <p style="margin-top: 0;">Olá,</p>
          ${tabela('Pendências do mês', 'Notas pendentes ou em andamento com vencimento no mês atual.', pendencias)}
          ${tabela('Lembrete de atualização', 'Estas notas estão em análise ou contingência. Atualize o comentário/status no sistema hoje, se houver novidade.', lembretes)}
          <div style="margin-top: 30px; text-align: center;">
            <a href="https://it-fincontrol.vercel.app/" style="background-color: #E30613; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
              Acessar Sistema
            </a>
          </div>
        </div>
        <div style="background-color: #f8fafc; padding: 15px; text-align: center; color: #94a3b8; font-size: 11px;">
          Este é um e-mail automático gerado pelo sistema.
        </div>
      </div>
    `;

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
      tls: { rejectUnauthorized: false },
    });

    await transporter.sendMail({
      from: '"Gestão de Notas" <automacaocicopal@gmail.com>',
      to: 'suporte.ba@cicopal.com.br, felipe.moreira@cicopal.com.br, contratos.ti@cicopal.com.br',
      subject: `[Notas TI] ${pendencias.length} pendências e ${lembretes.length} lembretes`,
      html: htmlEmail,
    });

    return NextResponse.json({ success: true, pendencias: pendencias.length, lembretes: lembretes.length });
  } catch (error) {
    console.error('[notificar-pendencias] Erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
