import { NextResponse } from 'next/server';
import { validateUserSession } from '@/lib/server-auth-limit';
import { chatCompletion, LLMError, ChatMessage } from '@/lib/llm';
import { getTeamPrincipal } from '@/lib/paddock-crew';
import { sanitizeNoirLine } from '@/lib/war-room-briefing';

export const maxDuration = 20;

export async function POST(request: Request) {
  try {
    const { user, error: authError } = await validateUserSession(request);
    if (authError || !user) {
      return NextResponse.json(
        { error: 'ai_unavailable', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const teamCode = typeof body?.teamCode === 'string' ? body.teamCode.toUpperCase() : 'FER';
    const poletime = typeof body?.poletime === 'string' ? body.poletime : '1:32.450';
    const top3 = typeof body?.top3 === 'string' ? body.top3 : 'NOR, VER, LEC';

    const principal = getTeamPrincipal(teamCode);

    const staticFallback = `>_ A mesa tática da ${principal.teamName} está encerrada. Pole em ${poletime} e Top 3 com ${top3}. Assuma o pit wall e feche os eventos de pista.`;

    if (!process.env.LLM_API_KEY && !process.env.LLM_BASE_URL?.includes('localhost')) {
      return NextResponse.json({
        ok: true,
        statement: staticFallback,
        principalCode: principal.code,
        principalName: principal.fullName,
        fallback: true,
      });
    }

    const systemPrompt = [
      `Você é ${principal.code} (${principal.fullName}), Chefe de Equipe (${principal.teamName}) no universo TS1 terminal noir.`,
      `PERSONALIDADE: ${principal.personality}.`,
      `FOCO NO BRIEFING: ${principal.briefingFocus}.`,
      '',
      'Sua tarefa: Dar a palavra final encerrando a reunião de estratégia antes da corrida.',
      `O estrategista definiu: Pole em ${poletime} e Top 3 projetado em ${top3}.`,
      '',
      'REGRAS RÍGIDAS:',
      '- Inicie sua fala com ">_ ".',
      '- Frases curtas (máximo 2 frases), tom firme, autoritário e exigente de liderança.',
      '- SEM emojis, sem clichês de assistente virtual.',
      '- Finalize ordenando que o estrategista assuma o pit wall para o grid.',
      '- Responda em Português do Brasil.',
    ].join('\n');

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Encerre o alinhamento de estratégia com a equipe.' },
    ];

    try {
      const raw = await chatCompletion({
        messages,
        temperature: 0.5,
        maxTokens: 180,
      });

      const line = sanitizeNoirLine(raw, staticFallback);
      return NextResponse.json({
        ok: true,
        statement: line,
        principalCode: principal.code,
        principalName: principal.fullName,
        avatarUrl: principal.avatarUrl,
        fallback: false,
      });
    } catch {
      return NextResponse.json({
        ok: true,
        statement: staticFallback,
        principalCode: principal.code,
        principalName: principal.fullName,
        avatarUrl: principal.avatarUrl,
        fallback: true,
      });
    }
  } catch (err: unknown) {
    return NextResponse.json(
      { error: 'ai_unavailable', message: '>_ Sem sinal com a liderança da equipe.' },
      { status: 500 }
    );
  }
}
