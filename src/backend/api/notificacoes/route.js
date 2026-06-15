import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const dynamic = 'force-dynamic';

const normalizeText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const parseDateLocal = (value) => {
  if (!value) return null;
  const [dateOnly] = String(value).split('T');
  const [year, month, day] = dateOnly.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const diasAteVencimento = (value) => {
  const due = parseDateLocal(value);
  if (!due) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - today.getTime()) / 86400000);
};

const getNotaGroup = (nota) => {
  if (nota?.etapa) return nota.etapa;
  const status = normalizeText(nota?.status_pagamento);

  if (status.includes('conclu') || status.includes('pago')) return 'concluida';
  if (status.includes('conting') || status.includes('diverg') || status.includes('rejeit')) return 'contingencia';
  if (status.includes('analise') || status.includes('aprovacao') || status.includes('confirmacao')) return 'em_analise';
  if (status.includes('andamento')) return 'em_andamento';
  return 'pendente';
};

const fornecedorNome = (nota) => nota.nome_fornecedor || nota.fornecedor?.nome_empresa || 'Fornecedor nao informado';
const notaTitulo = (nota) => nota.numero_nota ? `NF ${nota.numero_nota}` : `Lancamento #${nota.id}`;

const camposFaltantes = (nota) => {
  const campos = [
    ['fornecedor', nota.fornecedor_id],
    ['filial', nota.filial_id],
    ['nota', nota.numero_nota],
    ['valor', nota.valor],
    ['vencimento', nota.data_vencimento],
    ['CNPJ', nota.cnpj_usado],
    ['centro de custo', nota.centro_custo_usado],
    ['pedido', nota.numero_pedido],
    ['nota fiscal', nota.arquivo_nota],
    ['boleto', nota.arquivo_boleto],
  ];

  return campos.filter(([, value]) => !value).map(([label]) => label);
};

async function eventosRecentesPorEmail() {
  try {
    const desde = new Date();
    desde.setDate(desde.getDate() - 7);

    const { data, error } = await supabase
      .from('lancamento_eventos')
      .select('*')
      .eq('tipo', 'feedback_email')
      .gte('created_at', desde.toISOString())
      .order('created_at', { ascending: false })
      .limit(15);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.warn('[notificacoes] Eventos de auditoria indisponiveis:', error.message);
    return [];
  }
}

export async function GET() {
  try {
    const { data: notas = [], error } = await supabase
      .from('lancamentos')
      .select(`
        id,
        etapa,
        status_pagamento,
        numero_nota,
        fornecedor_id,
        filial_id,
        valor,
        data_vencimento,
        cnpj_usado,
        centro_custo_usado,
        numero_pedido,
        arquivo_nota,
        arquivo_boleto,
        fornecedor:fornecedores(nome_empresa)
      `)
      .order('id', { ascending: false })
      .limit(500);

    if (error) throw error;

    const notasPorId = new Map(notas.map((nota) => [String(nota.id), nota]));
    const notificacoes = [];

    notas.forEach((nota) => {
      const group = getNotaGroup(nota);
      const status = normalizeText(nota.status_pagamento);
      const fornecedor = fornecedorNome(nota);
      const tituloNota = notaTitulo(nota);
      const dias = diasAteVencimento(nota.data_vencimento);
      const prazo = dias === null
        ? ''
        : dias < 0
          ? ` | vencida ha ${Math.abs(dias)} dia(s)`
          : ` | vence em ${dias} dia(s)`;
      const base = {
        id: nota.id,
        notaId: nota.id,
        fornecedor,
        numero_nota: nota.numero_nota,
        search: nota.numero_nota || fornecedor,
      };

      if (group === 'em_andamento') {
        const faltantes = camposFaltantes(nota);
        notificacoes.push({
          ...base,
          key: `${nota.id}-finalizar-preenchimento`,
          severity: 'warning',
          title: `${tituloNota} precisa ser finalizada`,
          description: faltantes.length ? `Faltam: ${faltantes.slice(0, 4).join(', ')}${faltantes.length > 4 ? '...' : ''}` : fornecedor,
          sort: 20,
        });
      }

      if (status.includes('confirmacao gopa')) {
        notificacoes.push({
          ...base,
          key: `${nota.id}-gopa-aguardando`,
          severity: 'info',
          title: `${tituloNota} enviada para GOPA`,
          description: `Aguardando retorno do destinatario${prazo}`,
          sort: 30,
        });
      }

      if (group === 'contingencia') {
        notificacoes.push({
          ...base,
          key: `${nota.id}-contingencia`,
          severity: 'error',
          title: `${tituloNota} precisa de acao`,
          description: nota.status_pagamento || 'Nota em contingencia',
          sort: 10,
        });
      }
    });

    const eventos = await eventosRecentesPorEmail();
    eventos.forEach((evento) => {
      const nota = notasPorId.get(String(evento.lancamento_id));
      const tituloNota = nota ? notaTitulo(nota) : `Lancamento #${evento.lancamento_id}`;
      const fornecedor = nota ? fornecedorNome(nota) : 'Fornecedor nao informado';
      const action = evento.metadata?.action || '';
      const problema = action === 'problema_pagamento' || action === 'sem_saldo';

      notificacoes.push({
        id: `evento-${evento.id}`,
        notaId: evento.lancamento_id,
        fornecedor,
        numero_nota: nota?.numero_nota,
        search: nota?.numero_nota || fornecedor,
        key: `evento-${evento.id}`,
        severity: problema ? 'error' : 'success',
        title: problema ? `${tituloNota}: problema informado` : `${tituloNota}: pagamento confirmado`,
        description: evento.descricao || 'Retorno recebido pelo link do e-mail',
        sort: problema ? 1 : 50,
      });
    });

    const { data: usuariosPendentes, error: erroUsuarios } = await supabase
      .from('usuarios')
      .select('id, username, nome_completo, setor, cargo, ativo')
      .eq('ativo', false)
      .limit(20);

    if (erroUsuarios) {
      console.warn('[notificacoes] Usuarios pendentes indisponiveis:', erroUsuarios.message);
    }

    (usuariosPendentes || []).forEach((usuario) => {
      const nome = usuario.nome_completo || usuario.username || `Usuario #${usuario.id}`;
      notificacoes.push({
        id: `usuario-${usuario.id}`,
        userId: usuario.id,
        key: `usuario-${usuario.id}-aprovacao`,
        severity: 'warning',
        title: `${nome} realizou cadastro`,
        description: `Aguardando aprovacao de acesso${usuario.setor ? ` | ${usuario.setor}` : ''}`,
        search: usuario.username || nome,
        targetView: 'usuarios',
        sort: 15,
      });
    });

    const ordenadas = notificacoes
      .sort((a, b) => a.sort - b.sort || String(a.title).localeCompare(String(b.title)))
      .slice(0, 30);

    return NextResponse.json(ordenadas, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[notificacoes] Erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
