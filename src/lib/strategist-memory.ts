/**
 * TS1 // STRATEGIST USER MEMORY
 *
 * Gerencia a memória tática de desempenho do usuário no pit wall (taxa de acerto recente,
 * resumo de palpites passados) para injeção nos prompts dos estrategistas.
 *
 * REGRA DE DADOS:
 * - Nenhum número é inventado. Sem histórico real, a memória volta com hasHistory = false
 *   e accuracyRate = null, e os personagens não citam taxa de acerto.
 * - Os valores só podem ser gravados por código que compara palpites com resultados oficiais.
 *
 * PRIVACIDADE / LGPD:
 * - Armazena apenas métricas agregadas de jogo (accuracy_rate, resumo tático curto).
 * - Sem dados pessoais identificáveis.
 * - O usuário pode limpar sua memória a qualquer momento.
 */

import { createClient } from '@supabase/supabase-js';

export interface StrategistMemory {
  userId: string;
  hasHistory: boolean;          // true apenas quando existe ao menos 1 GP pontuado de verdade
  accuracyRate: number | null;  // ex: 74.5 (%). null quando não há histórico
  totalPredictions: number;     // GPs pontuados. 0 quando não há histórico
  recentPicksSummary: string | null; // ex: "Acertou 6/10 no Top 10 em Interlagos." null sem histórico
  updatedAt: string | null;
}

// Fallback em memória para ambientes locais ou antes da migration
const memoryFallbackMap = new Map<string, StrategistMemory>();

export function getEmptyMemory(userId: string): StrategistMemory {
  return {
    userId,
    hasHistory: false,
    accuracyRate: null,
    totalPredictions: 0,
    recentPicksSummary: null,
    updatedAt: null,
  };
}

function normalizeMemory(userId: string, raw: {
  accuracy_rate?: unknown;
  total_predictions?: unknown;
  recent_picks_summary?: unknown;
  updated_at?: unknown;
}): StrategistMemory {
  const total = Number(raw.total_predictions);
  const rate = raw.accuracy_rate === null || raw.accuracy_rate === undefined ? NaN : Number(raw.accuracy_rate);
  const hasHistory = Number.isFinite(total) && total > 0 && Number.isFinite(rate);

  if (!hasHistory) return getEmptyMemory(userId);

  const summary = typeof raw.recent_picks_summary === 'string' && raw.recent_picks_summary.trim()
    ? raw.recent_picks_summary.trim()
    : null;

  return {
    userId,
    hasHistory: true,
    accuracyRate: Math.round(rate * 10) / 10,
    totalPredictions: total,
    recentPicksSummary: summary,
    updatedAt: typeof raw.updated_at === 'string' ? raw.updated_at : null,
  };
}

function getDbClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function getUserStrategistMemory(userId: string): Promise<StrategistMemory> {
  const dbClient = getDbClient();

  if (dbClient) {
    try {
      const { data, error } = await dbClient
        .from('strategist_user_memory')
        .select('accuracy_rate, total_predictions, recent_picks_summary, updated_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        return normalizeMemory(userId, data);
      }
    } catch {
      // Falha ao acessar tabela; usa fallback
    }
  }

  return memoryFallbackMap.get(userId) || getEmptyMemory(userId);
}

/**
 * Grava a memória a partir de métricas JÁ CALCULADAS EM CÓDIGO.
 * Nunca deve receber números vindos da LLM.
 */
export async function updateUserStrategistMemory(
  userId: string,
  update: { accuracyRate: number; totalPredictions: number; recentPicksSummary: string | null }
): Promise<void> {
  const updated = normalizeMemory(userId, {
    accuracy_rate: update.accuracyRate,
    total_predictions: update.totalPredictions,
    recent_picks_summary: update.recentPicksSummary,
    updated_at: new Date().toISOString(),
  });

  const dbClient = getDbClient();
  if (dbClient) {
    try {
      const { error } = await dbClient.from('strategist_user_memory').upsert(
        {
          user_id: userId,
          accuracy_rate: updated.accuracyRate,
          total_predictions: updated.totalPredictions,
          recent_picks_summary: updated.recentPicksSummary,
          updated_at: updated.updatedAt,
        },
        { onConflict: 'user_id' }
      );
      if (!error) return;
    } catch {
      // Ignora erro e salva em memória
    }
  }

  memoryFallbackMap.set(userId, updated);
}

export async function clearUserStrategistMemory(userId: string): Promise<void> {
  memoryFallbackMap.delete(userId);

  const dbClient = getDbClient();
  if (dbClient) {
    try {
      await dbClient.from('strategist_user_memory').delete().eq('user_id', userId);
    } catch {
      // Ignora erro
    }
  }
}

/**
 * Bloco de memória para o system prompt. Só cita números quando há histórico real.
 */
export function buildMemoryPromptLine(memory: StrategistMemory | null | undefined, tone: 'senior' | 'technical'): string {
  if (!memory || !memory.hasHistory || memory.accuracyRate === null) {
    return 'HISTÓRICO TÁTICO DO USUÁRIO: ainda não existe histórico pontuado deste estrategista. NÃO cite taxa de acerto, número de GPs nem palpites passados. Se fizer sentido, diga apenas que o histórico dele começa agora.';
  }

  const summary = memory.recentPicksSummary ? ` Resumo: "${memory.recentPicksSummary}".` : '';
  const guidance = tone === 'senior'
    ? 'Se oportuno, comente esse histórico em tom experiente.'
    : 'Use esse histórico para calibrar a margem de risco.';

  return `HISTÓRICO TÁTICO DO USUÁRIO (MEMÓRIA): ${memory.totalPredictions} GP(s) pontuado(s), assertividade de ${memory.accuracyRate}%.${summary} ${guidance}`;
}
