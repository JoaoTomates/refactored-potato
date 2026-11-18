import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateUserSession, checkRateLimitAndUsage } from '@/lib/server-auth-limit';
import { chatCompletion, LLMError, ChatMessage } from '@/lib/llm';
import { TEAM_PRINCIPALS } from '@/lib/paddock-crew';
import { buildTeamPrincipalReactionPrompt } from '@/lib/strategist-personas';

export const maxDuration = 30;

// Cache de contingência em memória caso a tabela do Supabase ainda não tenha sido aplicada
const memoryReactionCache = new Map<string, string>();

export async function POST(request: Request) {
  try {
    // 1. Validação de Sessão Supabase
    const { user, error: authError } = await validateUserSession(request);
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Acesso negado: sessão do estrategista não identificada.' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
    }

    const round = String(body.round || 'current').trim();
    const teamCode = String(body.teamCode || 'FER').toUpperCase().trim();
    const userPoints = typeof body.userPoints === 'number' ? body.userPoints : 0;
    const rank = typeof body.rank === 'number' ? body.rank : undefined;
    const circuitName = typeof body.circuitName === 'string' ? body.circuitName : 'Grande Prêmio';
    const locale = typeof body.locale === 'string' ? body.locale : 'pt';

    // 2. Classificação do resultado (Aritmética 100% em código, NUNCA pela LLM)
    let resultTier: 'victory' | 'average' | 'poor' = 'average';
    if (userPoints >= 180 || (rank !== undefined && rank <= 3)) {
      resultTier = 'victory';
    } else if (userPoints < 80 || (rank !== undefined && rank >= 14)) {
      resultTier = 'poor';
    }

    const teamPrincipal = TEAM_PRINCIPALS[teamCode] || TEAM_PRINCIPALS['FER'];
    const fallbackText = teamPrincipal.reactions[resultTier] || 'Telemetria pós-corrida em processamento.';

    // 3. Consulta de Cache no Supabase (Gera apenas UMA vez por usuário e rodada)
    const cacheKey = `${user.id}:${round}:${teamCode}`;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && serviceRoleKey) {
      try {
        const dbClient = createClient(supabaseUrl, serviceRoleKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const { data: cached, error: cacheErr } = await dbClient
          .from('team_principal_reactions_cache')
          .select('reaction_text')
          .eq('user_id', user.id)
          .eq('round', round)
          .eq('team_code', teamCode)
          .maybeSingle();

        if (!cacheErr && cached?.reaction_text) {
          return NextResponse.json({
            reaction: cached.reaction_text,
            cached: true,
            tier: resultTier,
            principalCode: teamPrincipal.code,
          });
        }
      } catch {
        // Tabela ainda não migrada; continua para verificar fallback em memória
      }
    }

    if (memoryReactionCache.has(cacheKey)) {
      return NextResponse.json({
        reaction: memoryReactionCache.get(cacheKey),
        cached: true,
        tier: resultTier,
        principalCode: teamPrincipal.code,
      });
    }

    // 4. Se não há chave de API ou provedor não configurado, retorna o roteiro fixo silenciosamente
    if (!process.env.LLM_API_KEY && !process.env.LLM_BASE_URL?.includes('localhost')) {
      return NextResponse.json({
        reaction: fallbackText,
        cached: false,
        fallback: true,
        tier: resultTier,
        principalCode: teamPrincipal.code,
      });
    }

    // 5. Geração Única com IA
    try {
      const systemPrompt = buildTeamPrincipalReactionPrompt({
        teamPrincipal,
        resultTier,
        userPoints,
        rank,
        circuitName,
        locale,
      });

      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Chefe, a bandeirada quadriculada foi dada. Nossos pontos oficiais consolidados no painel: ${userPoints} pts (${rank ? `P${rank}` : 'posição média'}). Qual o debriefing da equipe?`,
        },
      ];

      const generatedText = await chatCompletion({
        messages,
        temperature: 0.7,
        maxTokens: 180,
      });

      // 6. Salva no banco de dados para nunca mais gastar cota nessa rodada
      if (supabaseUrl && serviceRoleKey) {
        try {
          const dbClient = createClient(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          });

          await dbClient.from('team_principal_reactions_cache').insert({
            user_id: user.id,
            round,
            team_code: teamCode,
            result_tier: resultTier,
            reaction_text: generatedText,
          });
        } catch {
          // Salva no fallback em memória
          memoryReactionCache.set(cacheKey, generatedText);
        }
      } else {
        memoryReactionCache.set(cacheKey, generatedText);
      }

      return NextResponse.json({
        reaction: generatedText,
        cached: false,
        tier: resultTier,
        principalCode: teamPrincipal.code,
      });
    } catch (llmErr) {
      console.warn('[Post-Race Reaction] Erro na geração da IA, aplicando reação estática:', (llmErr as Error)?.message);
      return NextResponse.json({
        reaction: fallbackText,
        cached: false,
        fallback: true,
        tier: resultTier,
        principalCode: teamPrincipal.code,
      });
    }
  } catch (error: unknown) {
    const message = (error as Error)?.message || 'Erro ao processar reação pós-corrida.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
