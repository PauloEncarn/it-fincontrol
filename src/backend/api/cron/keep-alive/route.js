import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const dynamic = 'force-dynamic';

export async function GET() {
  const startedAt = new Date();
  const table = process.env.SUPABASE_KEEPALIVE_TABLE || 'usuarios';

  try {
    const { error, count } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .limit(1);

    if (error) {
      throw error;
    }

    return NextResponse.json(
      {
        ok: true,
        service: 'supabase-keep-alive',
        table,
        count,
        checked_at: startedAt.toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('[keep-alive] Supabase ping failed:', error);

    return NextResponse.json(
      {
        ok: false,
        service: 'supabase-keep-alive',
        table,
        error: error.message,
        checked_at: startedAt.toISOString(),
      },
      { status: 500 }
    );
  }
}
