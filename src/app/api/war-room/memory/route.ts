import { NextResponse } from 'next/server';
import { validateUserSession } from '@/lib/server-auth-limit';
import { getUserStrategistMemory, clearUserStrategistMemory } from '@/lib/strategist-memory';

export const maxDuration = 15;

/**
 * GET /api/war-room/memory
 * Consulta a memória tática agregada do usuário (assertividade, total de GPs, histórico).
 */
export async function GET(request: Request) {
  try {
    const { user, error: authError } = await validateUserSession(request);
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Acesso negado: sessão não identificada.' },
        { status: 401 }
      );
    }

    const memory = await getUserStrategistMemory(user.id);
    return NextResponse.json({ ok: true, memory });
  } catch (err: unknown) {
    const msg = (err as Error)?.message || 'Erro ao carregar memória tática.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * DELETE /api/war-room/memory
 * Redefine e limpa o histórico de memória tática do usuário (privacidade/LGPD).
 */
export async function DELETE(request: Request) {
  try {
    const { user, error: authError } = await validateUserSession(request);
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Acesso negado: sessão não identificada.' },
        { status: 401 }
      );
    }

    await clearUserStrategistMemory(user.id);
    return NextResponse.json({
      ok: true,
      message: 'Memória tática redefinida com sucesso para o padrão de fábrica.',
    });
  } catch (err: unknown) {
    const msg = (err as Error)?.message || 'Erro ao limpar memória tática.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
