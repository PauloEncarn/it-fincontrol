import { jwtVerify } from 'jose';

const AUDIT_FIELDS = [
  'filial_id',
  'fornecedor_id',
  'competencia',
  'valor',
  'valor_previsto',
  'data_vencimento',
  'data_envio',
  'contrato_usado',
  'centro_custo_usado',
  'cnpj_usado',
  'numero_nota',
  'serie',
  'descricao_servico',
  'servico_protheus',
  'numero_medicao',
  'numero_pedido',
  'solicitacao_fluig',
  'observacao',
  'etapa',
  'status_pagamento',
  'arquivo_nota',
  'arquivo_boleto',
];

export async function getActorFromRequest(request) {
  const fallback = { ator_id: null, ator_nome: 'Sistema', ator_username: null, origem: 'sistema' };
  const authorization = request?.headers?.get?.('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';

  if (!token) return fallback;

  try {
    const secret = new TextEncoder().encode(process.env.SUPABASE_SERVICE_ROLE_KEY || 'segredo');
    const { payload } = await jwtVerify(token, secret);

    return {
      ator_id: payload.sub ? String(payload.sub) : null,
      ator_nome: payload.nome || payload.username || 'Usuario',
      ator_username: payload.username || null,
      origem: 'usuario',
    };
  } catch (error) {
    console.warn('[audit] Token nao identificado:', error.message);
    return fallback;
  }
}

export function diffLancamentoFields(antes = {}, depois = {}, fields = AUDIT_FIELDS) {
  return fields
    .filter((field) => String(antes?.[field] ?? '') !== String(depois?.[field] ?? ''))
    .map((field) => ({
      campo: field,
      antes: antes?.[field] ?? null,
      depois: depois?.[field] ?? null,
    }));
}

export async function registrarEventoLancamento(supabase, evento) {
  const lancamentoId = evento.lancamentoId || evento.lancamento_id || null;

  try {
    const { error } = await supabase
      .from('lancamento_eventos')
      .insert([{
        lancamento_id: lancamentoId,
        tipo: evento.tipo,
        titulo: evento.titulo,
        descricao: evento.descricao || null,
        ator_nome: evento.ator?.ator_nome || evento.ator_nome || 'Sistema',
        ator_username: evento.ator?.ator_username || evento.ator_username || null,
        origem: evento.origem || evento.ator?.origem || 'sistema',
        metadata: evento.metadata || {},
        antes: evento.antes || null,
        depois: evento.depois || null,
      }]);

    if (error) throw error;
  } catch (error) {
    console.warn('[audit] Evento nao registrado:', error.message);
  }
}
