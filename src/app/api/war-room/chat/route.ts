import { NextResponse } from 'next/server';
import { streamChatCompletion, LLMError, ChatMessage } from '@/lib/llm';
import { validateUserSession, checkRateLimitAndUsage } from '@/lib/server-auth-limit';
import { getRaceWeekDossier } from '@/lib/f1-dossier';
import { buildStrategistSystemPrompt } from '@/lib/strategist-personas';
import { SENIOR_STRATEGISTS, getSeniorStrategistById } from '@/lib/race-directors';
import { TECHNICAL_STRATEGISTS_POOL } from '@/lib/technical-strategists';

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    // 1. Validação de Sessão Supabase
    const { user, error: authError } = await validateUserSession(request);
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Acesso negado: sessão do estrategista não identificada.', details: authError },
        { status: 401 }
      );
    }

    // 2. Limite de Requisições & Cota Diária
    const limitCheck = await checkRateLimitAndUsage(user);
    if (!limitCheck.ok) {
      return NextResponse.json(
        { error: limitCheck.error, remainingToday: limitCheck.remainingToday },
        { status: limitCheck.status || 429 }
      );
    }

    // 3. Leitura e Sanitização do Payload
    const body = await request.json().catch(() => null);
    if (!body || typeof body.message !== 'string') {
      return NextResponse.json(
        { error: 'Parâmetro "message" inválido ou ausente no payload.' },
        { status: 400 }
      );
    }

    const userMessage = body.message.trim();
    if (!userMessage) {
      return NextResponse.json(
        { error: 'Mensagem vazia não pode ser transmitida pelo rádio.' },
        { status: 400 }
      );
    }

    const characterType = body.characterType === 'technical' ? 'technical' : 'senior';
    const characterId = typeof body.characterId === 'string' ? body.characterId.trim() : '';
    const circuitId = typeof body.circuitId === 'string' ? body.circuitId.trim() : 'americas';
    const topic = body.topic || 'GENERAL';
    const userDriverCode = typeof body.driverCode === 'string' ? body.driverCode.trim() : undefined;
    const locale = typeof body.locale === 'string' ? body.locale : 'pt';
    const raceWeekDay = typeof body.raceWeekDay === 'string' ? body.raceWeekDay : undefined;
    const raceWeekObjective = typeof body.raceWeekObjective === 'string' ? body.raceWeekObjective : undefined;

    // 4. Resolve o Personagem Específico
    let seniorData = null;
    let techData = null;

    if (characterType === 'senior') {
      seniorData =
        getSeniorStrategistById(characterId) ||
        SENIOR_STRATEGISTS.find((s) => s.code.toLowerCase() === characterId.toLowerCase()) ||
        SENIOR_STRATEGISTS[0];
    } else {
      techData =
        TECHNICAL_STRATEGISTS_POOL.find(
          (t) => t.id === characterId || t.code.toLowerCase() === characterId.toLowerCase()
        ) || TECHNICAL_STRATEGISTS_POOL[0];
    }

    // 5. Monta o Dossiê de Telemetria da Etapa
    const dossier = await getRaceWeekDossier(circuitId, userDriverCode);

    // 6. Constrói o System Prompt da Persona
    const systemPromptContent = buildStrategistSystemPrompt({
      characterType,
      seniorData,
      techData,
      dossier,
      topic,
      locale,
      raceWeekDay,
      raceWeekObjective,
    });

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: systemPromptContent,
      },
    ];

    // Histórico recente (máximo 4 trocas para economizar janela de contexto)
    if (Array.isArray(body.history)) {
      const recentHistory = body.history.slice(-4);
      for (const item of recentHistory) {
        if (item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string') {
          messages.push({
            role: item.role,
            content: item.content.slice(0, 500),
          });
        }
      }
    }

    // Mensagem atual do usuário (DADO estrito, limitado a 500 caracteres)
    messages.push({
      role: 'user',
      content: userMessage.slice(0, 500),
    });

    // 7. Streaming da resposta com o cliente unificado
    const stream = await streamChatCompletion({
      messages,
      temperature: 0.65,
      maxTokens: 300,
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-RateLimit-Remaining': String(limitCheck.remainingToday ?? 0),
        'X-Character-Code': characterType === 'senior' ? seniorData?.code || 'SENIOR' : techData?.code || 'TECH',
      },
    });
  } catch (error: unknown) {
    if (error instanceof LLMError) {
      const status = error.status || (error.code === 'RATE_LIMIT' ? 429 : 503);
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status }
      );
    }

    const message = (error as Error)?.message || 'Falha na comunicação de rádio com o pit wall.';
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
