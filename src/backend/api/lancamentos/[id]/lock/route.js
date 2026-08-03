import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getActorFromRequest } from '@/backend/utils/audit';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const LOCK_SECONDS = 90;

const isActiveLock = (lock) => lock?.expires_at && new Date(lock.expires_at).getTime() > Date.now();

const lockPayload = (id, ator, sessionId) => ({
  lancamento_id: Number(id),
  usuario_id: ator.ator_id,
  usuario_nome: ator.ator_nome || 'Usuario',
  usuario_username: ator.ator_username,
  session_id: sessionId,
  locked_at: new Date().toISOString(),
  heartbeat_at: new Date().toISOString(),
  expires_at: new Date(Date.now() + LOCK_SECONDS * 1000).toISOString(),
});

async function getCurrentLock(id) {
  const { data, error } = await supabase
    .from('lancamento_edicao_locks')
    .select('*')
    .eq('lancamento_id', id)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function GET(request, context) {
  try {
    const params = await context.params;
    const id = params.id;
    const lock = await getCurrentLock(id);

    return NextResponse.json({ locked: Boolean(isActiveLock(lock)), lock });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request, context) {
  try {
    const ator = await getActorFromRequest(request);
    const params = await context.params;
    const id = params.id;
    const body = await request.json().catch(() => ({}));
    const sessionId = String(body.session_id || '').trim();
    const force = body.force === true;

    if (!id || id === 'undefined') return NextResponse.json({ error: 'ID invalido.' }, { status: 400 });
    if (!sessionId) return NextResponse.json({ error: 'Sessao de edicao nao informada.' }, { status: 400 });

    const current = await getCurrentLock(id);
    const ownLock = current?.session_id === sessionId;

    if (isActiveLock(current) && !ownLock && !force) {
      return NextResponse.json({
        error: `Nota em edicao por ${current.usuario_nome || 'outro usuario'}.`,
        locked: true,
        lock: current,
      }, { status: 423 });
    }

    const payload = lockPayload(id, ator, sessionId);
    if (ownLock) payload.locked_at = current.locked_at;

    const { data, error } = await supabase
      .from('lancamento_edicao_locks')
      .upsert(payload, { onConflict: 'lancamento_id' })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ locked: true, lock: data, acquired: !ownLock });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    const params = await context.params;
    const id = params.id;
    const body = await request.json().catch(() => ({}));
    const sessionId = String(body.session_id || '').trim();

    if (!id || id === 'undefined') return NextResponse.json({ error: 'ID invalido.' }, { status: 400 });
    if (!sessionId) return NextResponse.json({ error: 'Sessao de edicao nao informada.' }, { status: 400 });

    const { error } = await supabase
      .from('lancamento_edicao_locks')
      .delete()
      .eq('lancamento_id', id)
      .eq('session_id', sessionId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
