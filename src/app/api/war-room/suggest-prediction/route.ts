import { NextResponse } from 'next/server';
import { validateUserSession, checkRateLimitAndUsage } from '@/lib/server-auth-limit';
import { chatCompletion, LLMError, ChatMessage } from '@/lib/llm';
import { getRaceWeekDossier } from '@/lib/f1-dossier';
import { validateSuggestedPrediction, ValidatedPrediction } from '@/lib/prediction-validator';
import { getUserStrategistMemory } from '@/lib/strategist-memory';

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    // 1. Validação de Sessão Supabase
    const { user, error: authError } = await validateUserSession(request);
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Acesso negado: sessão não identificada.' },
        { status: 401 }
      );
    }

    // 2. Limite de Requisições
    const limitCheck = await checkRateLimitAndUsage(user);
    if (!limitCheck.ok) {
      return NextResponse.json(
        { error: limitCheck.error, remainingToday: limitCheck.remainingToday },
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

    // 4. Se não há chave de API, retorna recomendação canônica estruturada sem travar
    if (!process.env.LLM_API_KEY && !process.env.LLM_BASE_URL?.includes('localhost')) {
      const canonicalPole = dossier.poleStats.avgPoleTime || '1:32.450';
      const fallbackPrediction = {
        poletime: canonicalPole,
        top10: ['NOR', 'VER', 'LEC', 'PIA', 'RUS', 'HAM', 'SAI', 'ALO', 'GAS', 'ALB'],
        evo: ['HAM', 'SAI', 'ALO', 'TSU', 'ALB'],
        h2h: {
          m1: '04', m2: '16', m3: '63', m4: '01', m5: '14',
          m6: '10', m7: '31', m8: '30', m9: '11', m10: '55', m11: '27',
        },
        misc: { q1: 'SIM', q2: 'NÃO', q3: 'NÃO' },
        reasoning: 'Sugestão tática baseada na média histórica e nos modelos canônicos de telemetria.',
      };

      const validated = validateSuggestedPrediction(fallbackPrediction);
      return NextResponse.json({
        ok: true,
        suggestion: validated.data,
        fallback: true,
      });
    }

    // 5. Chamada à LLM exigindo saída estrita em JSON
    const systemPrompt = [
      'Você é um motor de estratégia de F1 do universo BAEFF1.',
      'Sua tarefa é PROPOR uma estratégia completa de palpites para a rodada no formato JSON EXATO abaixo.',
      'Aritmética e números devem basear-se no seguinte dossiê:',
      dossier.shortSummary,
      `Taxa de assertividade histórica do usuário: ${memory.accuracyRate}%.`,
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

    const rawResponse = await chatCompletion({
      messages,
      temperature: 0.4, // Mais determinístico para JSON
      maxTokens: 500,
    });

    // 6. Sanitização e Validação do JSON
    let parsed: any = null;
    try {
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = JSON.parse(rawResponse);
      }
    } catch {
      // JSON malformado pela LLM: rejeição limpa
      return NextResponse.json(
        { error: 'A IA retornou um formato de dados inválido.', code: 'INVALID_JSON' },
        { status: 422 }
      );
    }

    const validationResult = validateSuggestedPrediction(parsed);
    if (!validationResult.valid || !validationResult.data) {
      return NextResponse.json(
        {
          error: 'A sugestão da IA continha parâmetros fora do regulamento da FIA.',
          details: validationResult.errors,
          code: 'SCHEMA_VALIDATION_FAILED',
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      ok: true,
      suggestion: validationResult.data,
      fallback: false,
      remainingToday: limitCheck.remainingToday,
    });
  } catch (error: unknown) {
    if (error instanceof LLMError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 503 });
    }
    const message = (error as Error)?.message || 'Erro ao gerar sugestão de estratégia.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
