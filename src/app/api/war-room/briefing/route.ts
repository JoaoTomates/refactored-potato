import { NextResponse } from 'next/server';
import { validateUserSession, checkRateLimitAndUsage } from '@/lib/server-auth-limit';
import { chatCompletion, LLMError, ChatMessage } from '@/lib/llm';
import { getRaceWeekDossier } from '@/lib/f1-dossier';
import { getUserStrategistMemory, buildMemoryPromptLine } from '@/lib/strategist-memory';
import {
  WarRoomBriefing,
  validateBriefingPayload,
  buildFallbackBriefing,
  getCachedBriefing,
  setCachedBriefing,
} from '@/lib/war-room-briefing';
import { SENIOR_STRATEGISTS, getSeniorStrategistById } from '@/lib/race-directors';
import { TECHNICAL_STRATEGISTS_POOL } from '@/lib/technical-strategists';

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    // 1. Validação de Sessão Supabase
    const { user, error: authError } = await validateUserSession(request);
    if (authError || !user) {
      return NextResponse.json(
        { error: 'ai_unavailable', code: 'UNAUTHORIZED', message: '>_ Acesso negado: sessão não identificada.' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const circuitId = typeof body?.circuitId === 'string' ? body.circuitId.trim() : 'americas';
    const round = typeof body?.round === 'string' ? body.round.trim() : 'current';
    const seniorId = typeof body?.seniorId === 'string' ? body.seniorId.trim() : '';
    const techId = typeof body?.techId === 'string' ? body.techId.trim() : '';

    // 2. Cache em memória do servidor por usuário e rodada
    const cached = getCachedBriefing(user.id, round);
    if (cached) {
      return NextResponse.json({
        ok: true,
        briefing: cached,
        cached: true,
        fallback: false,
      });
    }

    // 3. Resolve Personagens e Dossiê de Telemetria
    const seniorData = getSeniorStrategistById(seniorId) || SENIOR_STRATEGISTS[0];
    const techData = TECHNICAL_STRATEGISTS_POOL.find((t) => t.id === techId) || TECHNICAL_STRATEGISTS_POOL[0];

    const [dossier, memory] = await Promise.all([
      getRaceWeekDossier(circuitId),
      getUserStrategistMemory(user.id),
    ]);

    const canonicalPole = dossier.poleStats.avgPoleTime || '1:32.450';
    const fallbackTop10 = ['NOR', 'VER', 'LEC', 'PIA', 'RUS', 'HAM', 'SAI', 'ALO', 'GAS', 'ALB'];

    const fallbackBriefing = buildFallbackBriefing({
      seniorPole: canonicalPole,
      techPole: canonicalPole,
      seniorTop10: fallbackTop10,
      techTop10: fallbackTop10,
    });

    // 4. Sem chave de IA -> Fallback canônico imediato
    if (!process.env.LLM_API_KEY && !process.env.LLM_BASE_URL?.includes('localhost')) {
      return NextResponse.json({
        ok: true,
        briefing: fallbackBriefing,
        fallback: true,
      });
    }

    // 5. Rate limit & Cota Diária
    const limitCheck = await checkRateLimitAndUsage(user);
    if (!limitCheck.ok) {
      return NextResponse.json({
        ok: true,
        briefing: fallbackBriefing,
        fallback: true,
        remainingToday: limitCheck.remainingToday,
      });
    }

    // 6. Chamada à LLM para gerar o Briefing Unificado
    const memoryDirective = buildMemoryPromptLine(memory, 'senior');

    const systemPrompt = [
      'Você é a central de estratégia do universo TS1.',
      'Gere o briefing tático completo para a War Room na rodada atual.',
      'Existem dois estrategistas com visões opostas:',
      `- Sênior (${seniorData.code} - ${seniorData.displayName}): experiente, emocional, fala de pressão e história da pista.`,
      `- Técnico (${techData.code} - ${techData.fullName}): pragmático, focado em delta de tempo, pneus e telemetria fria.`,
      '',
      `DOSSIÊ DA PISTA: ${dossier.shortSummary}`,
      `MEMÓRIA DO PILOTO: ${memoryDirective}`,
      '',
      'REGRAS RÍGIDAS DE JSON (NENHUM TEXTO FORA DO JSON):',
      '{',
      '  "poletime": {',
      `    "senior": { "value": "${canonicalPole}", "line": ">_ Fala do Sênior justificando o tempo em tom noir (2 frases)." },`,
      `    "technical": { "value": "${canonicalPole}", "line": ">_ Fala do Técnico contrapondo com telemetria (2 frases)." }`,
      '  },',
      '  "top10": {',
      '    "senior": { "value": ["NOR", "VER", "LEC", "PIA", "RUS", "HAM", "SAI", "ALO", "GAS", "ALB"], "line": ">_ Fala curta do Sênior." },',
      '    "technical": { "value": ["VER", "NOR", "LEC", "RUS", "PIA", "HAM", "SAI", "ALO", "ALB", "GAS"], "line": ">_ Fala curta do Técnico." }',
      '  },',
      '  "evo": {',
      '    "senior": { "value": ["HAM", "SAI", "ALO", "TSU", "ALB"], "line": ">_ Fala curta do Sênior." },',
      '    "technical": { "value": ["SAI", "ALO", "TSU", "ALB", "OCO"], "line": ">_ Fala curta do Técnico." }',
      '  },',
      '  "h2h": {',
      '    "senior": { "value": { "m1": "04", "m2": "16", "m3": "63", "m4": "01", "m5": "14", "m6": "10", "m7": "31", "m8": "30", "m9": "11", "m10": "55", "m11": "27" }, "line": ">_ Fala curta." },',
      '    "technical": { "value": { "m1": "81", "m2": "44", "m3": "12", "m4": "01", "m5": "14", "m6": "43", "m7": "87", "m8": "41", "m9": "77", "m10": "23", "m11": "05" }, "line": ">_ Fala curta." }',
      '  },',
      '  "memoryHook": ">_ Citação sutil do histórico do piloto se houver histórico real, ou null se não houver."',
      '}',
      'REGRAS DE FORMATAÇÃO:',
      `- Poletime DEVE ser no formato M:SS.mmm próximo de ${canonicalPole}.`,
      '- Todas as falas devem começar estritamente com ">_ ". Sem emojis, sem clichês de IA corporativa.',
    ].join('\n');

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Compilar briefing para o circuito ${dossier.circuitName}. Retorne estritamente o JSON.` },
    ];

    try {
      const rawText = await chatCompletion({
        messages,
        temperature: 0.5,
        maxTokens: 900,
      });

      let parsed: any = null;
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else parsed = JSON.parse(rawText);

      const validated = validateBriefingPayload(parsed, dossier.poleStats.avgPoleMs);
      if (validated) {
        setCachedBriefing(user.id, round, validated);
        return NextResponse.json({
          ok: true,
          briefing: validated,
          fallback: false,
          remainingToday: limitCheck.remainingToday,
        });
      }

      console.warn('[WAR_ROOM_BRIEFING] Validação do payload falhou, aplicando fallback canônico.');
    } catch (llmErr) {
      console.warn('[WAR_ROOM_BRIEFING] Falha na chamada da LLM, ativando fallback silencioso:', (llmErr as Error)?.name || 'Error');
    }

    // 7. Retorno do fallback canônico sem quebrar a tela
    return NextResponse.json({
      ok: true,
      briefing: fallbackBriefing,
      fallback: true,
      remainingToday: limitCheck.remainingToday,
    });
  } catch (err: unknown) {
    console.error('[WAR_ROOM_BRIEFING_CRITICAL]', (err as Error)?.name || 'Error');
    return NextResponse.json(
      { error: 'ai_unavailable', code: 'AI_UNAVAILABLE', message: '>_ Sem sinal com o pit wall. Tente novamente em instantes.' },
      { status: 503 }
    );
  }
}
