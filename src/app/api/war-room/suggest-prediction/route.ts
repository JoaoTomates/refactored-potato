import { NextResponse } from 'next/server';
import { validateUserSession, checkRateLimitAndUsage } from '@/lib/server-auth-limit';
import { chatCompletion, LLMError, ChatMessage } from '@/lib/llm';
import { getRaceWeekDossier } from '@/lib/f1-dossier';
import { validateSuggestedPrediction, ValidatedPrediction } from '@/lib/prediction-validator';
import { getUserStrategistMemory, buildMemoryPromptLine } from '@/lib/strategist-memory';

export const maxDuration = 30;

function getFallbackStrategy(canonicalPole: string): ValidatedPrediction {
  const fallbackPrediction = {
    poletime: canonicalPole || '1:32.450',
    top10: ['NOR', 'VER', 'LEC', 'PIA', 'RUS', 'HAM', 'SAI', 'ALO', 'GAS', 'ALB'],
    evo: ['HAM', 'SAI', 'ALO', 'TSU', 'ALB'],
    h2h: {
      m1: '04', m2: '16', m3: '63', m4: '01', m5: '14',
      m6: '10', m7: '31', m8: '30', m9: '11', m10: '55', m11: '27',
    },
    misc: { q1: 'SIM', q2: 'NÃO', q3: 'NÃO' },
    reasoning: 'Sem sinal com o pit wall. Telemetria operando com a linha de base histórica do circuito.',
  };

  const validated = validateSuggestedPrediction(fallbackPrediction);
  return validated.data!;
}

export async function POST(request: Request) {
  try {
    // 1. Validação de Sessão Supabase
    const { user, error: authError } = await validateUserSession(request);
    if (authError || !user) {
      return NextResponse.json(
        {
          error: 'ai_unavailable',
          code: 'UNAUTHORIZED',
          message: '>_ Acesso negado: sessão do estrategista não identificada.',
        },
        { status: 401 }
      );
    }

    // 2. Limite de Requisições
    const limitCheck = await checkRateLimitAndUsage(user);
    if (!limitCheck.ok) {
      return NextResponse.json(
        {
          error: 'ai_unavailable',
          code: 'RATE_LIMIT',
          message: '>_ Cota diária de rádio atingida. Consulte o dossiê da equipe.',
          remainingToday: limitCheck.remainingToday,
        },
        { status: limitCheck.status || 429 }
      );
    }

    const body = await request.json().catch(() => null);
    const circuitId = typeof body?.circuitId === 'string' ? body.circuitId.trim() : 'americas';
    const characterType = body?.characterType === 'technical' ? 'technical' : 'senior';
    const driverCode = typeof body?.driverCode === 'string' ? body.driverCode.trim() : undefined;

    // 3. Obtém dossiê de telemetria e histórico do usuário
    const [dossier, memory] = await Promise.all([
      getRaceWeekDossier(circuitId, driverCode),
      getUserStrategistMemory(user.id),
    ]);

    const canonicalPole = dossier.poleStats.avgPoleTime || '1:32.450';

    // 4. Se não há chave de API, retorna recomendação canônica estruturada sem travar
    if (!process.env.LLM_API_KEY && !process.env.LLM_BASE_URL?.includes('localhost')) {
      return NextResponse.json({
        ok: true,
        suggestion: getFallbackStrategy(canonicalPole),
        fallback: true,
        remainingToday: limitCheck.remainingToday,
      });
    }

    // 5. Chamada à LLM exigindo saída estrita em JSON
    const systemPrompt = [
      'Você é um motor de estratégia de F1 do universo TS1.',
      'Sua tarefa é PROPOR uma estratégia completa de palpites para a rodada no formato JSON EXATO abaixo.',
      'Aritmética e números devem basear-se no seguinte dossiê:',
      dossier.shortSummary,
      buildMemoryPromptLine(memory, 'technical'),
      '',
      'REGRAS RÍGIDAS DE JSON (NÃO ESCREVA NENHUM TEXTO FORA DO JSON):',
      '{',
      '  "poletime": "1:32.329",',
      '  "top10": ["NOR", "VER", "LEC", "PIA", "RUS", "HAM", "SAI", "ALO", "GAS", "ALB"],',
      '  "evo": ["HAM", "SAI", "ALO", "TSU", "ALB"],',
      '  "h2h": { "m1": "04", "m2": "16", "m3": "63", "m4": "01", "m5": "14", "m6": "10", "m7": "31", "m8": "30", "m9": "11", "m10": "55", "m11": "27" },',
      '  "misc": { "q1": "SIM", "q2": "NÃO", "q3": "NÃO" },',
      '  "reasoning": "Resumo de 2 frases em tom noir justificando a aposta."',
      '}',
      'REGRAS DE DADOS:',
      '- top10: exatamente 10 códigos únicos de 3 letras da F1.',
      '- evo: exatamente 5 códigos únicos de 3 letras.',
      '- poletime: formato M:SS.mmm alinhado com a média da pista.',
    ].join('\n');

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Gere a proposta tática consolidada para o ${dossier.circuitName}. Retorne estritamente o JSON.`,
      },
    ];

    try {
      const rawResponse = await chatCompletion({
        messages,
        temperature: 0.4,
        maxTokens: 500,
      });

      // 6. Sanitização e Validação do JSON
      let parsed: any = null;
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = JSON.parse(rawResponse);
      }

      const validationResult = validateSuggestedPrediction(parsed);
      if (validationResult.valid && validationResult.data) {
        return NextResponse.json({
          ok: true,
          suggestion: validationResult.data,
          fallback: false,
          remainingToday: limitCheck.remainingToday,
        });
      }

      console.warn('[SUGGEST_PREDICTION] Validação de schema da IA falhou, ativando fallback histórico');
    } catch (llmErr) {
      console.warn('[SUGGEST_PREDICTION] Falha na chamada da LLM, ativando fallback histórico:', (llmErr as Error)?.name || 'Error');
    }

    // 7. Degradação elegante: Se a IA falhar ou o JSON for inválido, entrega a proposta de contingência
    return NextResponse.json({
      ok: true,
      suggestion: getFallbackStrategy(canonicalPole),
      fallback: true,
      remainingToday: limitCheck.remainingToday,
    });
  } catch (error: unknown) {
    console.error('[SUGGEST_PREDICTION_CRITICAL_ERROR]', (error as Error)?.name || 'Error');
    return NextResponse.json(
      {
        error: 'ai_unavailable',
        code: 'AI_UNAVAILABLE',
        message: '>_ Sem sinal com o pit wall. Tente novamente em instantes.',
      },
      { status: 503 }
    );
  }
}
